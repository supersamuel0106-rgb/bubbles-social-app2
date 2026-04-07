from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    解析並驗證 JWT Token，確認此請求為有效登入使用者。
    支援 Supabase 舊版的 HS256 與現代化的 ES256 (ECC) 加密方式。
    """
    token = credentials.credentials
    try:
        # 1. 預先解析 Header 以決定加密算法
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg")
        
        # 2. 準備驗證所需的金鑰
        if alg == "ES256":
            # 這是從您的 Supabase 控制台拿到的 ECC P-256 公鑰元件
            # 我們使用 JWK 格式直接讓 python-jose 解析，這比轉換成 PEM 格式更直接且不易出錯
            key = {
                "kty": "EC",
                "crv": "P-256",
                "x": "fnTrWJ9I8GqsvLAumiPLLy-Ga7B8BoUADaOFVeR_DDA",
                "y": "FO74mT7dwKr-qikVxMBegSC-ehDpCl2MsqNbLb8jqGU",
                "alg": "ES256",
                "use": "sig",
                "kid": "d4330c99-954d-4c55-b8f6-0ec1f08ba845"
            }
        else:
            # 預設回退至 HS256 (傳統共享密鑰)
            key = settings.SUPABASE_JWT_SECRET
            
        # 3. 進行解密與驗證
        payload = jwt.decode(
            token,
            key,
            algorithms=["HS256", "ES256"],
            options={"verify_aud": False}
        )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="無法從 token 中解析使用者帳號",
            )
        return user_id

    except JWTError as e:
        print(f"JWT Verification failed (alg: {alg if 'alg' in locals() else 'unknown'}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"不合法或已過期的 Token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
