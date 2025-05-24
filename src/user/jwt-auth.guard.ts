import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { jwtVerify } from 'jose';
import {UserService} from './user.service';
import { error } from 'console';
@Injectable()
export class JwtAuthGuard implements CanActivate {
     constructor(private readonly userService: UserService) {}


  private readonly jwtSecret = new TextEncoder().encode('hdhad');

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-auth-token'];
    try {
    if (!token) {
      throw new UnauthorizedException('Missing or invalid token');
    }

      const { payload } = await jwtVerify(token, this.jwtSecret);
      if (typeof payload.id !== 'string' || typeof payload.userId !== 'string') {
        throw new UnauthorizedException('Invalid token payload');
      }
      const user = await this.userService.getSingleUser(payload.userId as string);
      request.user = payload; // Attach user info to request
      return true;
    } catch (error){
      
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
