import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './role.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async create(createRoleDto: Partial<Role>): Promise<Role> {
    try {
      const { Role: roleName } = createRoleDto;

      const existingRole = await this.roleModel.findOne({ Role: roleName });
      if (existingRole) {
        throw new ConflictException('Role already exists');
      }

      const role = new this.roleModel({
        ...createRoleDto,
        createdBy: createRoleDto.createdBy || 'system',
      });

      return role.save();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error creating role');
    }
  }

  async getAll(query: any = {}): Promise<Role[]> {
    try {
      const { page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      return this.roleModel.find()
        .skip(skip)
        .limit(Number(limit))
        .exec();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error fetching roles');
    }
  }

  async getById(id: string): Promise<Role> {
    try {
      const role = await this.roleModel.findById(id).exec();
      if (!role) throw new NotFoundException('Role not found');
      return role;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error fetching role');
    }
  }

  async update(id: string, updateRoleDto: Partial<Role>): Promise<Role> {
    try {
      const role = await this.roleModel.findById(id);
      if (!role) throw new NotFoundException('Role not found');

      Object.assign(role, updateRoleDto);
      return role.save();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error updating role');
    }
  }

  async delete(id: string): Promise<Role> {
    try {
      const role = await this.roleModel.findById(id);
      if (!role) throw new NotFoundException('Role not found');

      await this.roleModel.deleteOne({ _id: id });
      return role;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error deleting role');
    }
  }
}
  