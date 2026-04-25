from fastapi import Header, HTTPException, status

from .schemas import UserProfile
from .firebase import verify_token


def get_current_user(authorization: str = Header(default="")) -> UserProfile:
    scheme = "Bearer "
    if not authorization.startswith(scheme):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token.",
        )

    token = authorization[len(scheme) :].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty Bearer token.",
        )

    try:
        decoded = verify_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase token: {exc}",
        ) from exc

    return UserProfile(
        uid=decoded["uid"],
        email=decoded.get("email"),
        name=decoded.get("name"),
    )
