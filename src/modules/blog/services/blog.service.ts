import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from "@nestjs/common";
import { CreateBlogDto, UpdateBlogDto } from "../dto/blog.dto";
import { FindOptionsRelations, FindOptionsSelect, Repository } from "typeorm";
import { Blog } from "../entities/blog.entity";
import { ShopService } from "../../shop/services/shop.service";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { CategoryService } from "../../category/category.service";
import { InjectRepository } from "@nestjs/typeorm";
import { createSlug, randomId } from "utility/function.util";
import { S3Service } from "src/modules/s3/s3.service";
import { isArray } from "class-validator";
import { BlogCategory } from "../entities/blog-category.entity";
import { Shop } from "src/modules/shop/entities/shop.entity";
import { paginationDto } from "src/common/dtos/pagination.dto";
import {
  paginationGenerator,
  paginationResolver,
} from "utility/pagination.util";

@Injectable({ scope: Scope.REQUEST })
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
    @InjectRepository(BlogCategory)
    private blogCategoryRepository: Repository<BlogCategory>,
    private s3Service: S3Service,
    private readonly shopService: ShopService,
    private readonly categoryService: CategoryService,
    @Inject(REQUEST) private request: Request
  ) {}

  /**
   * Creates a new blog post with image upload and category associations
   *
   * @param createBlogDto - Data Transfer Object containing blog metadata and content
   * @param image - Uploaded image file via Multer middleware
   * @param shopId - Optional ID for shop association (for shop-specific blogs)
   * @returns Success message object
   * @throws BadRequestException - For:
   * - Invalid categories format
   * - Non-numeric category IDs
   * - Slug generation failures
   * @throws NotFoundException - If:
   * - Associated shop not found
   * - Shop category not found
   * @throws ConflictException - If generated slug already exists
   */
  async create(
    createBlogDto: CreateBlogDto,
    image: Express.Multer.File,
    shopId?: number
  ) {
    const user = this.request["user"];
    let shop: Shop | null = null;
    if (shopId) {
      shop = await this.shopService.findOneById(shopId);
    }

    let { title, content, description, categories, slug, status } =
      createBlogDto;

    if (!isArray(categories) && typeof categories === "string") {
      categories = categories.split(",");
    } else if (!isArray(categories)) {
      throw new BadRequestException("Enter the categories correctly.");
    }
    const { Location, Key } = await this.s3Service.uploadFile(
      image[0],
      "blog_image"
    );

    let slugData = slug ?? title;
    slug = createSlug(slugData);
    const isSlugExist = await this.checkBlogBySlug(slug);
    if (isSlugExist) {
      slug = slug + `${randomId()}`;
    }

    //* Create and persist blog entity
    let blog = this.blogRepository.create({
      title,
      slug,
      content,
      description,
      shopId: shopId ?? null,
      status,
      image: Location,
      imageKey: Key,
      authorId: user.id,
    });
    blog = await this.blogRepository.save(blog);

    let allowedCategories: number[] | null = null;
    if (shop) {
      const shopCategory = await this.categoryService.findOne(
        shop.categoryId,
        true
      );

      allowedCategories = shopCategory.subcategories.reduce(
        (acc, sub) => [...acc, sub.id],
        [shopCategory.id]
      );
    }

    for (let categoryId of allowedCategories ?? categories) {
      if (isNaN(parseInt(categoryId.toString()))) {
        throw new BadRequestException();
      }
      const category = await this.categoryService.findOne(+categoryId);

      await this.blogCategoryRepository.insert({
        blogId: blog.id,
        categoryId: +category.id,
      });
    }
    return {
      message: "blog created successfully.",
    };
  }

  async checkBlogBySlug(slug: string) {
    const blog = await this.blogRepository.findOneBy({ slug });
    return blog;
  }

  /**
   * Defines the selection relations for the Blog entity used in database queries.
   * - TODO: Extend the selection to include the `author` relation, specifically the `username` property.
   */
  private readonly blogSelectRelations: FindOptionsSelect<Blog> = {
    shop: {
      id: true,
      name: true,
    },
    categories: {
      id: true,
      category: {
        id: true,
        name: true,
        image: true,
      },
    },
    //TODO: add author username to select
    // author: {},
  };
  private readonly blogRelations: FindOptionsRelations<Blog> = {
    shop: true,
    categories: {
      category: true,
    },
    // author: true,
  };

  async findOneBySlug(slug: string) {
    if (slug.trim() === "") {
      throw new BadRequestException("slug is empty");
    }
    const blog = await this.blogRepository.find({
      where: { slug: slug },
      relations: this.blogRelations,
      select: this.blogSelectRelations,
    });
    if (!blog) {
      throw new NotFoundException("blog not found");
    }
    return blog;
  }

  async findOneById(blogId: number) {
    const blog = await this.blogRepository.find({
      where: { id: blogId },
      relations: this.blogRelations,
      select: this.blogSelectRelations,
    });
    if (!blog) {
      throw new NotFoundException("blog not found");
    }
    return blog;
  }

  async findAll(paginationDto: paginationDto) {
    const { page, limit, skip } = paginationResolver(
      paginationDto.page,
      paginationDto.limit
    );
    const [blogs, count] = await this.blogRepository.findAndCount({
      where: {},
      relations: this.blogRelations,
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
        authorId: true,
        slug: true,
        image: true,
        content: false,
        ...this.blogSelectRelations,
      },

      skip,
      take: limit,
      order: { id: "DESC" },
    });
    return { pagination: paginationGenerator(count, page, limit), blogs };
  }

  update(id: number, updateBlogDto: UpdateBlogDto) {
    return `This action updates a #${id} blog`;
  }

  /**
   * Soft deletes a blog and its associated categories by setting the `deletedAt` timestamp.
   *
   * @param blogId - The ID of the blog to be soft deleted.
   * @throws {NotFoundException} If the blog with the given ID is not found.
   * @returns An object containing a success message.
   */
  async softDelete(blogId: number, shopId: number) {
    const blog = await this.blogRepository.findOneBy({ id: blogId });
    if (!blog) {
      throw new NotFoundException(`Blog not found`);
    }
    if (blog.shopId !== shopId) {
      throw new ForbiddenException(`You are not allowed to delete this blog`);
    }
    const now = new Date();
    blog.deletedAt = now;

    // Update deletedAt for associated categories
    const blogCategories = await this.blogCategoryRepository.find({
      where: { blogId },
    });

    for (const blogCategory of blogCategories) {
      blogCategory.deletedAt = now;
    }

    await this.blogCategoryRepository.save(blogCategories);
    await this.blogRepository.save(blog);

    return { message: `Blog deleted successfully` };
  }
}
