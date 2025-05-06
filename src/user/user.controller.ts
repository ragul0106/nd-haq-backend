import { Controller, Get, Post, Body, Param, Put, Delete, Req, UseGuards, Query, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.schema';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FindUserQueryDto } from './user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('/create')
  async create(@Body() createUserDto: Partial<User>,@Req() req) {
    req.message = 'user created successfully';
    return this.userService.create(createUserDto);
  }

  @Post('/login')
  async login(@Body() loginUserDto: Partial<User>,@Req() req) {
    req.message = 'logged in successfully';
    return this.userService.login(loginUserDto);
  }

  @Get('/read/all')
async findAll(@Query() query: FindUserQueryDto,@Req() req) {
  req.message = 'All users fetched successfully';
  return this.userService.getAlluser(query);
}



@Get('/read/:id')
async findOne(@Param('id') id: string,@Req() req) {
  req.message = 'User fetched successfully';
  return this.userService.getSingleUser(id);
}

@Patch('/update/:id')
async update(@Param('id') id: string, @Body() updateUserDto: Partial<User>,@Req() req) {
  req.message = 'User updated successfully';
  return this.userService.updateUser(id, updateUserDto);  
}

@Delete('/delete/:id')

async delete(@Param('id') id: string,@Req() req) {
  req.message = 'User deleted successfully';
  return this.userService.removeUser(id);
}

@Get('/pending')
  async findPendingUsers(@Query() query: FindUserQueryDto,@Req() req) {
    req.message = 'Pending users fetched successfully';
    return await this.userService.getPendingUsers(query);
}

@Get('/PendingAndApprovedUserCount')
async getPendingAndApprovedUserCount(@Req() req) {
  req.message = 'Pending and approved users count fetched successfully';
  const pendingUsersCount = await this.userService.getPendingUsersCount();
  const approvedUsersCount = await this.userService.getApprovedUsersCount();
  return { pendingUsersCount, approvedUsersCount };
}

@Put('/approve/:id')
async approveUser(@Param('id') id: string, @Body() body: { isApproved: boolean,roles:string[] },@Req() req) {

  console.log(id);
  req.message = 'User approved successfully';

  return this.userService.approveUser(id, body.isApproved, body.roles);
}

@Get('/aprovedUsers')
async findApprovedUsers(@Query() query: FindUserQueryDto,@Req() req) {
  req.message = 'Approved users fetched successfully';
  return this.userService.getApprovedUsers(query);
}

@Get('/role/:role')
async findByRole(@Param('role') role: string,@Req() req) {
  req.message = 'Users with role fetched successfully';
  return this.userService.getUsersByRole(role);
}
@Get('/roles')
async findAllRoles(@Req() req) {
  req.message = 'Users with role fetched successfully';
  return this.userService.getRoles();
}

@Put('/updateRole/:id')
async updateRole(@Param('id') id: string, @Body() body: { roles: string[] },@Req() req) {
  req.message = 'User role updated successfully';
  return this.userService.updateRole(id, body.roles);

}
@Put('/deleteUser/:id')
async deleteUser(@Param('id') id: string, @Body() body: { isActive: boolean },@Req() req) {
  req.message = 'User deleted successfully';
  return this.userService.deleteUser(id);
}
}