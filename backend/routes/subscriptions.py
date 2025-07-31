from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from database.connection import get_db
from models.user import User
from models.subscription import Plan, Subscription, Payment, PlanType, SubscriptionStatus, PaymentStatus
from models.audit import AuditLog
from utils.auth import get_current_user

router = APIRouter()


@router.get("/plans", response_model=List[dict])
async def get_available_plans(db: Session = Depends(get_db)):
    """Get all available subscription plans"""
    plans = db.query(Plan).filter(Plan.is_active == True).all()
    
    plans_data = []
    for plan in plans:
        plans_data.append({
            "id": plan.id,
            "name": plan.name,
            "description": plan.description,
            "plan_type": plan.plan_type.value,
            "price_monthly": plan.price_monthly,
            "price_yearly": plan.price_yearly,
            "max_checkins_per_month": plan.max_checkins_per_month,
            "max_gyms_access": plan.max_gyms_access,
            "features": plan.features_list,
            "savings_yearly": (plan.price_monthly * 12 - plan.price_yearly) if plan.price_yearly else 0
        })
    
    return plans_data


@router.get("/my-subscription")
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current subscription"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).first()
    
    if not subscription:
        return {"message": "No active subscription", "subscription": None}
    
    return {
        "subscription": {
            "id": subscription.id,
            "plan": {
                "id": subscription.plan.id,
                "name": subscription.plan.name,
                "plan_type": subscription.plan.plan_type.value
            },
            "status": subscription.status.value,
            "start_date": subscription.start_date,
            "end_date": subscription.end_date,
            "is_yearly": subscription.is_yearly,
            "auto_renew": subscription.auto_renew,
            "checkins_used_this_month": subscription.checkins_used_this_month,
            "checkins_limit": subscription.plan.max_checkins_per_month,
            "days_remaining": subscription.days_remaining,
            "next_billing_date": subscription.next_billing_date
        }
    }


@router.post("/subscribe/{plan_id}")
async def subscribe_to_plan(
    plan_id: int,
    is_yearly: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe user to a plan"""
    
    # Get the plan
    plan = db.query(Plan).filter(Plan.id == plan_id, Plan.is_active == True).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Check if user already has an active subscription
    existing_subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).first()
    
    if existing_subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active subscription"
        )
    
    # Calculate subscription period and amount
    start_date = datetime.utcnow()
    if is_yearly:
        end_date = start_date + timedelta(days=365)
        amount = plan.price_yearly
        next_billing_date = end_date
    else:
        end_date = start_date + timedelta(days=30)
        amount = plan.price_monthly
        next_billing_date = start_date + timedelta(days=30)
    
    if not amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yearly pricing not available for this plan"
        )
    
    # Create subscription
    subscription = Subscription(
        user_id=current_user.id,
        plan_id=plan_id,
        status=SubscriptionStatus.ACTIVE,
        start_date=start_date,
        end_date=end_date,
        is_yearly=is_yearly,
        next_billing_date=next_billing_date,
        last_billing_date=start_date
    )
    
    db.add(subscription)
    db.flush()  # Get subscription ID
    
    # Create payment record
    payment = Payment(
        subscription_id=subscription.id,
        amount=amount,
        status=PaymentStatus.COMPLETED,  # In real app, this would be PENDING until payment is processed
        payment_method="credit_card",
        payment_date=datetime.utcnow(),
        description=f"Subscription to {plan.name} ({'yearly' if is_yearly else 'monthly'})"
    )
    
    db.add(payment)
    
    # Log the action
    AuditLog.log_action(
        db,
        user_id=current_user.id,
        action="SUBSCRIPTION_CREATED",
        entity_type="SUBSCRIPTION",
        entity_id=subscription.id,
        description=f"User subscribed to {plan.name} plan ({'yearly' if is_yearly else 'monthly'})"
    )
    
    db.commit()
    
    return {
        "message": "Subscription created successfully",
        "subscription_id": subscription.id,
        "amount_paid": amount,
        "next_billing_date": next_billing_date
    }


@router.post("/cancel")
async def cancel_subscription(
    reason: str = "User requested",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel user's current subscription"""
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    # Cancel subscription (but keep access until end date)
    subscription.status = SubscriptionStatus.CANCELLED
    subscription.auto_renew = False
    subscription.cancelled_at = datetime.utcnow()
    
    # Log the action
    AuditLog.log_action(
        db,
        user_id=current_user.id,
        action="SUBSCRIPTION_CANCELLED",
        entity_type="SUBSCRIPTION",
        entity_id=subscription.id,
        description=f"Subscription cancelled. Reason: {reason}"
    )
    
    db.commit()
    
    return {
        "message": "Subscription cancelled successfully",
        "access_until": subscription.end_date
    }


@router.post("/renew")
async def renew_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Renew user's subscription"""
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED])
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found"
        )
    
    # Calculate new period
    if subscription.is_yearly:
        new_end_date = subscription.end_date + timedelta(days=365)
        amount = subscription.plan.price_yearly
    else:
        new_end_date = subscription.end_date + timedelta(days=30)
        amount = subscription.plan.price_monthly
    
    # Update subscription
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.end_date = new_end_date
    subscription.next_billing_date = new_end_date
    subscription.last_billing_date = datetime.utcnow()
    subscription.auto_renew = True
    subscription.cancelled_at = None
    
    # Create payment record
    payment = Payment(
        subscription_id=subscription.id,
        amount=amount,
        status=PaymentStatus.COMPLETED,
        payment_method="credit_card",
        payment_date=datetime.utcnow(),
        description=f"Subscription renewal ({'yearly' if subscription.is_yearly else 'monthly'})"
    )
    
    db.add(payment)
    
    # Log the action
    AuditLog.log_action(
        db,
        user_id=current_user.id,
        action="SUBSCRIPTION_RENEWED",
        entity_type="SUBSCRIPTION",
        entity_id=subscription.id,
        description="Subscription renewed successfully"
    )
    
    db.commit()
    
    return {
        "message": "Subscription renewed successfully",
        "new_end_date": new_end_date,
        "amount_paid": amount
    }


@router.get("/payment-history")
async def get_payment_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's payment history"""
    
    # Get all user's subscriptions
    subscriptions = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).all()
    
    subscription_ids = [s.id for s in subscriptions]
    
    # Get payments for all subscriptions
    payments = db.query(Payment).filter(
        Payment.subscription_id.in_(subscription_ids)
    ).order_by(Payment.created_at.desc()).limit(limit).all()
    
    payment_history = []
    for payment in payments:
        subscription = next(s for s in subscriptions if s.id == payment.subscription_id)
        payment_history.append({
            "id": payment.id,
            "amount": payment.amount,
            "currency": payment.currency,
            "status": payment.status.value,
            "payment_method": payment.payment_method,
            "payment_date": payment.payment_date,
            "description": payment.description,
            "plan_name": subscription.plan.name,
            "created_at": payment.created_at
        })
    
    return {"payments": payment_history}


@router.post("/usage/checkin")
async def increment_checkin_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Increment check-in usage for current subscription"""
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    # Check if user can make more check-ins
    if not subscription.can_checkin():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-in limit reached for this month"
        )
    
    # Increment usage
    subscription.checkins_used_this_month += 1
    db.commit()
    
    return {
        "message": "Check-in usage incremented",
        "checkins_used": subscription.checkins_used_this_month,
        "checkins_limit": subscription.plan.max_checkins_per_month
    }


@router.get("/limits")
async def get_subscription_limits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current subscription limits"""
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).first()
    
    if not subscription:
        return {
            "has_subscription": False,
            "limits": {
                "max_checkins_per_month": 0,
                "checkins_used_this_month": 0,
                "checkins_remaining": 0,
                "max_gyms_access": 0,
                "can_checkin": False
            }
        }
    
    checkins_remaining = None
    if subscription.plan.max_checkins_per_month:
        checkins_remaining = subscription.plan.max_checkins_per_month - subscription.checkins_used_this_month
    
    return {
        "has_subscription": True,
        "plan_name": subscription.plan.name,
        "limits": {
            "max_checkins_per_month": subscription.plan.max_checkins_per_month,
            "checkins_used_this_month": subscription.checkins_used_this_month,
            "checkins_remaining": checkins_remaining,
            "max_gyms_access": subscription.plan.max_gyms_access,
            "can_checkin": subscription.can_checkin()
        }
    }
