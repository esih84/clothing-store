import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from "typeorm";
import { Blog } from "./blog.entity";
import { BaseEntity } from "src/common/abstracts/base.entity";
import { Category } from "src/modules/category/entities/category.entity";

@Entity("blog_category")
export class BlogCategory extends BaseEntity {
  @Column()
  blogId: number;
  @ManyToOne(() => Blog, (blog) => blog.categories, { onDelete: "CASCADE" })
  blog: Blog;
  @Column()
  categoryId: number;
  @ManyToOne(() => Category, (category) => category.blogs, {
    onDelete: "CASCADE",
  })
  category: Category;
}
