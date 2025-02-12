import { BaseEntity } from "src/common/abstracts/base.entity";
import { Otp } from "src/modules/auth/entities/otp.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  mobile: string;
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  refreshToken?: string;

  @OneToOne(() => Otp, (otp) => otp.user)
  otp: Otp;
}
