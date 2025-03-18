import { BaseEntity } from "src/common/abstracts/base.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";
import { UserDocumentType } from "../enums/user-document.enum";

@Entity("user_documents")
export class UserDocument extends BaseEntity {
  @Column()
  fileUrl: string;
  @Column({ default: false })
  isActive: boolean;
  @Column({ type: "enum", enum: UserDocumentType })
  documentType: UserDocumentType;
  @Column()
  userId: number;
  @ManyToOne(() => User, (user) => user.documents, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;
}
