import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Query,
    Patch,
    Delete,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { RoleService } from './role.service';
  import { Role } from './role.schema';
  import { JwtAuthGuard } from '../user/jwt-auth.guard'; // Adjust path as needed
  
  @Controller('roles')
  export class RoleController {
    constructor(private readonly roleService: RoleService) {}
  
    @Post('/create')
    @UseGuards(JwtAuthGuard)
    async create(@Body() createRoleDto: Partial<Role>, @Req() req) {
      req.message = 'Role created successfully';
      return this.roleService.create(createRoleDto);
    }
  
    @Get('/read/all')
    @UseGuards(JwtAuthGuard)
    async findAll(@Query() query, @Req() req) {
      req.message = 'All roles fetched successfully';
      return this.roleService.getAll(query);
    }
  
    @Get('/read/:id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string, @Req() req) {
      req.message = 'Role fetched successfully';
      return this.roleService.getById(id);
    }
  
    @Patch('/update/:id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateRoleDto: Partial<Role>, @Req() req) {
      req.message = 'Role updated successfully';
      return this.roleService.update(id, updateRoleDto);
    }
  
    @Delete('/delete/:id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string, @Req() req) {
      req.message = 'Role deleted successfully';
      return this.roleService.delete(id);
    }
  }
  