import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { jwtVerify } from 'jose';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtSecret = new TextEncoder().encode('your-secret-key');

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization'];

    if (!token) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);
      request.user = payload; // Attach user info to request
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
