import { BaseEntity } from "src/common/abstracts/base.entity";
import { Otp } from "src/modules/auth/entities/otp.entity";
import { ShopUserRole } from "src/modules/role/entities/shop-user-role.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { UserDocument } from "./user-document.entity";
import { UserStatus } from "../enums/user-status.enum";
import { Blog } from "src/modules/blog/entities/blog.entity";
import { Profile } from "src/modules/profile/entities/profile.entity";

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  mobile: string;
  @Column({ default: false })
  isVerified: boolean;
  @Column({ nullable: true })
  realName: string;
  @Column({ nullable: true })
  realFamily: string;
  @Column({ nullable: true })
  refreshToken?: string;

  @OneToOne(() => Otp, (otp) => otp.user)
  otp: Otp;
  @OneToMany(() => ShopUserRole, (shopUserRole) => shopUserRole.user)
  shopRoles: ShopUserRole[];
  @OneToMany(() => UserDocument, (userDocument) => userDocument.user)
  documents: UserDocument[];
  @Column({ type: "enum", enum: UserStatus, default: UserStatus.BASE })
  status: UserStatus;
  @OneToMany(() => Blog, (blog) => blog.author)
  blogs: Blog[];
  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true,
    eager: true,
  })
  profile: Profile;
}
