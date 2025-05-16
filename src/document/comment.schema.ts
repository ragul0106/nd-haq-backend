// comment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/user/user.schema';

@Schema({ _id: false })
export class DocumentComment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId | User;  // <-- Allow population with User object


  @Prop({ required: true })
  comment: string;

  @Prop({ required: true }) // ✅ Add this line
  role: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}


export const CommentSchema = SchemaFactory.createForClass(DocumentComment);
