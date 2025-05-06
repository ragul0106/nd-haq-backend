import { ConflictException, Injectable, UnauthorizedException, NotFoundException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { SignJWT } from 'jose';
import { isEmpty } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Role } from 'src/role/role.schema';


@Injectable()
export class UserService {
    private readonly jwtSecret = new TextEncoder().encode('your-secret-key');
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async create(createUserDto: Partial<User>): Promise<User> {
        try {
            const { email, registerSentence } = createUserDto;
            console.log(createUserDto);
            
            const existingUser = await this.userModel.findOne({ email });
            if (existingUser) {
                if(existingUser.isActive) {
                    throw new ConflictException('Email is already registered');
                }else{
                    existingUser.isActive = true;
                    existingUser.isApproved = false;
                    return existingUser.save();
                }
                
            }

            const user = new this.userModel({ email, isActive: true, isApproved: false, registerSentence, userId: uuidv4() ,name:createUserDto.name ,accountCreationReason:createUserDto.accountCreationReason });
            return user.save();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.log(error);
            throw new InternalServerErrorException('Error creating user');

        }

    }

    async login(loginUserDto: Partial<User>): Promise<{ token: string; userId: string; user: User }> {
        try {
            const { email } = loginUserDto;
    
            if (!email) {
                throw new NotFoundException('Email is required');
            }
    
            const user = await this.userModel.findOne({ email }).exec();

            
            if (!user) {
                throw new NotFoundException('Email not found, please register first');
            }
    
            if (!user.isApproved) {
                throw new UnauthorizedException('User not approved, please contact admin');
            }
    
            const token = await new SignJWT({ email: user.email, id: JSON.stringify(user._id), userId: user.userId ,isLoggedIn:true,roles:JSON.stringify(user.role), name:user.name,objectId:user._id })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('2h')
                .sign(this.jwtSecret);
    
            return { token, userId: user.userId, user };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('Login error:', error);
            throw new InternalServerErrorException('Error while logging in');
        }
    }
    
    async getAlluser(query: any = {}): Promise<User[]> {
        try {
            const { page = 1, limit = 10 } = query;
            const skip = (page - 1) * limit;


            return this.userModel
                .find(query)
                .skip(skip)
                .limit(Number(limit))
                .exec();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.log(error);
            
            throw new InternalServerErrorException('Error fetching users');
        }

    }

    async getSingleUser(userId: string): Promise<User> {
        try {
            const user = await this.userModel.findOne({ userId, isActive: true }).exec();
            if (!user) {
                throw new NotFoundException('User not found');
            }
            return user;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('error', error);
            throw new InternalServerErrorException('Error fetching user');

        }
    }

    async updateUser(userId: string, updateUserDto: Partial<User>): Promise<User> {
        try {
            const user = await this.userModel.findOne({ userId, isActive: true }).exec();
            if (!user) {
                throw new NotFoundException('User not found');
            }
    
            // No need to convert role to ObjectId anymore
    
            Object.assign(user, updateUserDto);
            return await user.save();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('error', error);
            throw new InternalServerErrorException('Error updating user');
        }
    }
    

    async removeUser(userId: string): Promise<User> {
        try {
            const user = await this.userModel.findOne({ userId, isActive: true }).exec();
            if (!user) {
                throw new NotFoundException('User not found');
            }
            user.isActive = false;
            return user.save();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Error deleting user');
        }
    }
 async getPendingUsers(query: any = {}): Promise<User[]> {
    try {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        
        return this.userModel
            .find({ isApproved: false, isActive: true })
            .skip(skip)
            .limit(Number(limit))
            .exec();
    } catch (error) {
        if (error instanceof HttpException) {
            throw error;
        }
        throw new InternalServerErrorException('Error fetching pending users');
    }
 }

    async approveUser(_id: string, isApproved: boolean,roles:string[]): Promise<User> {
        try {
            const user = await this.userModel.findOne({ _id }).exec();
            if (!user) {
                throw new NotFoundException('User not found');
            }
                user.role = roles;
                user.isApproved = true;
                user.save()
            return user;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }            
            throw new InternalServerErrorException('Error approving user');
        }
    }

    async getCurrentUser(_id:string) : Promise<User>{
        try {
            const user = await this.userModel.findOne({ _id, isActive: true }).exec();
            if (!user) {
                throw new NotFoundException('User not found');
            }
            return user;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Error fetching current user');
        }
        
    }

    async getUsersByRole(role: string): Promise<User[]> {
        try {
            console.log(role);
            
            const users = await this.userModel.find({ role, isActive: true }).exec();
            if (!users || users.length === 0) {
                throw new NotFoundException('No users found with this role');
            }
            return users;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Error fetching users by role');
        }
    }
    async getApprovedUsers(query: any = {}): Promise<User[]> {
        try {
            const { page = 1, limit = 10 } = query;
            const skip = (page - 1) * limit;

            return this.userModel
                .find({ isApproved: true, isActive: true })
                .skip(skip)
                .limit(Number(limit))
                .exec();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Error fetching approved users');
        }
    }
    
    async getRoles(): Promise<any[]> {
        try {
            
            const roles = ['Admin', 'Attester', 'Maker', 'Schema Designer'];
            return roles;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Error fetching roles');
        }
    }
    async updateRole(_id: string, role: string[]): Promise<User> {
        try {
            const user = await this.userModel.findOne({ _id }).exec();
            if (!user) {
                throw new NotFoundException('User not found');
            }
            if(role.length === 0) {
                   user.isApproved = false;

                   
            }

            user.role = role;
            return user.save();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Error updating user role');
        }
    }
    async deleteUser(_id: string): Promise<User> {
        try {
            const user = await this.userModel.findOne({ _id }).exec();
            if (!user) {
                throw new NotFoundException('User not found');
            }
            user.isActive = false;
            user.isApproved = false;
            user.role = [];


            return user.save();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Error deleting user');
        }

}

    async getPendingUsersCount(): Promise<number> {
        try {
            return this.userModel.countDocuments({ isApproved: false, isActive: true }).exec();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Error fetching pending users count');
        }
    }

    async getApprovedUsersCount(): Promise<number> {
        try {
            return this.userModel.countDocuments({ isApproved: true, isActive: true }).exec();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Error fetching approved users count');
        }
    }
}