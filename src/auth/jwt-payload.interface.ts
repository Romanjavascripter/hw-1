export interface JwtPayload {
    sub:string;
    login:string;
    jti?:string
}