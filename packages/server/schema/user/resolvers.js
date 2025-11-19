import { GraphQLError } from "graphql";
import { GraphQLDate, GraphQLDateTime } from "graphql-scalars";
import { db, PRIVATE_KEY } from "../../config/config.js";
import saveData from "../../utils/db/saveData.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import saveImage from "../../helpers/saveImage.js";
import tryParseJSON from "../../helpers/tryParseJSON.js";
import { getRoles } from "../role/resolvers.js";
import { getForms } from "../application_form/resolvers.js";

const loginUser = async ({ username, password, user_id, context }) => {
  try {
    let values = [];
    let where = "";

    if (username) {
      where += " AND users.username = ?";
      values.push(username);
    }

    if (user_id) {
      where += " AND users.id = ?";
      values.push(id);
    }

    let sql = `
          SELECT 
            users.*,
            roles.name as role_name,
            roles.permissions
          FROM users 
          LEFT JOIN roles ON roles.id = users.role_id
          WHERE users.deleted = 0 ${where}`;

    // let [results] = await db.execute(sql, values);
    const [results] = await db.execute(sql, values);

    const user = results[0];

    // console.log("user", results[0]);
    if (!user) throw new GraphQLError("Invalid Username or Password");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new GraphQLError("Invalid Username or Password");

    const tokenData = {
      id: user.id,
      email: user?.email || null,
      is_grower: user?.is_grower,
      is_merchant: user?.is_merchant,
      is_qds_producer: user?.is_qds_producer,
      permissions: tryParseJSON(tryParseJSON(user.permissions)),
    };

    const token = jwt.sign(tokenData, PRIVATE_KEY, {
      expiresIn: "1d",
    });

    context.res.setHeader("x-auth-token", `Bearer ${token}`);

    // Access the IP address from the context
    // const clientIpAddress = context.req.connection.remoteAddress;

    // using the role_id, to get the role of the user
    // const [role] = await getRoles({
    //   id: user.role_id,
    // });

    // if (!role) throw new GraphQLError("User has no role in the system!");

    return {
      success: true,
      message: "Login Successful",
      user: user,
      token,
    };
  } catch (error) {
    throw new GraphQLError(error.message);
  }
};

export const getUsers = async ({
  limit = 10,
  offset = 0,
  email,
  id,
  username,
  role_id,
}) => {
  try {
    let where = "WHERE users.deleted = 0";
    let values = [];

    if (email) {
      where += " AND users.email = ?";
      values.push(email);
    }

    if (id) {
      where += " AND users.id = ?";
      values.push(id);
    }

    if (username) {
      where += " AND users.username = ?";
      values.push(username);
    }

    if (role_id) {
      where += " AND users.role_id = ?";
      values.push(role_id);
    }

    let sql = `
      SELECT 
       users.*,
       roles.name as role_name
      FROM users 
      LEFT JOIN roles ON roles.id = users.role_id
      ${where} ORDER BY users.updated_at DESC LIMIT ? OFFSET ?
    `;

    values.push(limit, offset);

    const [results] = await db.execute(sql, values);

    return results;
  } catch (error) {
    throw new GraphQLError(error.message);
  }
};

// Light user/crop variety lookups
const fetchUserById = async (id) => {
  if (!id) return null;
  try {
    const [rows] = await db.execute(
      "SELECT id, name, email, image FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    if (!rows.length) return null;
    const u = rows[0];
    return { id: String(u.id), name: u.name, email: u.email, image: u.image };
  } catch (e) {
    return null;
  }
};

const userResolvers = {
  Date: GraphQLDate,
  Upload: GraphQLUpload,
  Query: {
    users: async (_, args) => {
      return await getUsers({});
    },
    me: async (_, args, context) => {
      const user_id = context.req.user.id;

      const [results] = await getUsers({
        id: user_id,
      });

      return results;
    },
  },
  User: {
    sr4_applications: async (parent) => {
      return await getForms({
        inspector_id: parent.id,
        form_type: "sr4",
      });
    },
  },
  Mutation: {
    register: async (parent, args, context) => {
      const {
        id,
        username,
        name,
        company_initials,
        premises_location,
        phone_number,
        password,
        email,
        district,
      } = args.payload;

      try {
        const users = await getUsers({
          email,
          limit: 1,
        });

        if (users[0] && !id)
          throw new GraphQLError("User email already exists!");

        const [usernameExists] = await getUsers({
          username,
          limit: 1,
        });

        if (usernameExists && !id)
          throw new GraphQLError("Username already exists!");

        // generate unique password for employee
        const salt = await bcrypt.genSalt();
        const hashedPwd = await bcrypt.hash(password, salt);

        // give the user a role of basic user
        const [basic_user] = await getRoles({
          role_name: "Basic User",
        });

        if (!basic_user) {
          throw new GraphQLError("Role is not yet defined.");
        }

        const data = {
          username,
          email,
          name,
          company_initials,
          premises_location,
          phone_number,
          password: hashedPwd,
          district,
          role_id: basic_user.id,
          created_at: new Date(),
          updated_at: new Date(),
        };

        if (!id) {
          data.id = uuidv4();
        }

        // then save in the db
        const save_id = await saveData({
          table: "users",
          data: data,
          id: id ? id : null,
        });

        return {
          success: true,
          message: "User Account created successfully",
          user: data,
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    createUser: async (parent, args, context) => {
      const {
        id,
        username,
        name,
        company_initials,
        premises_location,
        phone_number,
        password,
        email,
        district,
        image,
        role_id,
      } = args.payload;

      const isUpdate = Boolean(id);
      let imageId;

      try {
        // Enforce unique email for new users
        if (!isUpdate) {
          const existing = await getUsers({ email, limit: 1 });
          if (existing[0]) throw new GraphQLError("User email already exists!");

          const [usernameExists] = await getUsers({
            username,
            limit: 1,
          });

          if (usernameExists && !id)
            throw new GraphQLError("Username already exists!");
        }

        // For new users, password is required; for updates, skip password handling
        let hashedPwd;
        if (!isUpdate) {
          if (!password)
            throw new GraphQLError("Password is required for new users!");
          const salt = await bcrypt.genSalt();
          hashedPwd = await bcrypt.hash(password, salt);
        }

        // save user image
        if (image) {
          imageId = await saveImage({
            image,
          });
        }

        // Build data payload
        const data = {
          username,
          email,
          name,
          company_initials,
          premises_location,
          phone_number,
          district,
          updated_at: new Date(),
        };

        if (image) {
          data.image = imageId;
        }

        // Include role if provided
        if (role_id) data.role_id = role_id;

        // Only set password and created_at on create
        if (!isUpdate) {
          data.password = hashedPwd;
          data.created_at = new Date();
          // Assign UUID if not supplied by DB
          data.id = uuidv4();
        } else {
          if (password && password !== "") {
            // if its an update and the password is provided, then update the password
            const salt = await bcrypt.genSalt();
            hashedPwd = await bcrypt.hash(password, salt);
            data.password = hashedPwd;
          }
        }

        // Persist
        await saveData({
          table: "users",
          data,
          id: isUpdate ? id : null,
        });

        return {
          success: true,
          message: isUpdate
            ? "User Account updated successfully"
            : "User Account created successfully",
          user: { id, ...data },
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    updateUser: async (parent, args, context) => {
      // Validate user authentication/authorization first
      // if (!context.user) {
      //   throw new GraphQLError("Unauthorized - You must be logged in", {
      //     extensions: { code: "UNAUTHORIZED" },
      //   });
      // }

      // Check if the authenticated user has permission to update this user
      // (Add your specific authorization logic here)

      const {
        id,
        email,
        firstName,
        lastName,
        role,
        isActive,
        district,
        subcounty,
        school_id,
      } = args.payload;

      // Basic input validation
      if (!id) {
        throw new GraphQLError("User ID is required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      let connection;
      try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check if user exists
        const [user] = await getUsers({ id, limit: 1 });
        if (!user) {
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        // Prepare update data
        const updateData = {
          email: email || user.email, // Keep existing if not provided
          name: firstName || user.name,
          last_name: lastName || user.last_name,
          role: role || user.role,
          is_active: isActive !== undefined ? isActive : user.is_active,
          district: district || user.district,
          subcounty: subcounty || user.subcounty,
          school_id: school_id || user.school_id,
          updated_at: new Date(),
        };

        // Validate email format if it's being updated
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new GraphQLError("Invalid email format", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        // Update user in database
        await saveData({
          table: "users",
          data: updateData,
          id,
          connection,
        });

        await connection.commit();

        return {
          success: true,
          message: "User account updated successfully",
        };
      } catch (error) {
        if (connection) {
          await connection.rollback();
        }

        // Handle specific database errors
        if (error.code === "ER_DUP_ENTRY") {
          throw new GraphQLError("Email already exists", {
            extensions: { code: "CONFLICT" },
          });
        }

        // Pass through GraphQL errors, wrap others
        if (error instanceof GraphQLError) {
          throw error;
        }

        console.error("Update user error:", error);
        throw new GraphQLError("Failed to update user", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      } finally {
        if (connection) {
          connection.release();
        }
      }
    },
    login: async (parent, args, context) => {
      const result = await loginUser({
        username: args.username,
        password: args.password,
        context,
      });

      return result;
    },
    resetPassword: async (parent, args, context) => {
      const { id, newPassword } = args; // Note: Fixed typo from newPasswordd to newPassword
      let connection;

      try {
        // Authentication check
        // if (!context.user) {
        //   throw new GraphQLError("Unauthorized - You must be logged in", {
        //     extensions: { code: "UNAUTHORIZED" },
        //   });
        // }

        // Authorization - check if user has permission to reset this password
        // Option 1: Only allow users to reset their own password
        // if (context.user.id !== id && context.user.role !== 'ADMIN') {
        //   throw new GraphQLError("Unauthorized - You can only reset your own password", {
        //     extensions: { code: 'FORBIDDEN' },
        //   });
        // }

        // Option 2: Only allow admins to reset passwords
        // if (context.user.role !== 'ADMIN') {
        //   throw new GraphQLError("Unauthorized - Only admins can reset passwords", {
        //     extensions: { code: 'FORBIDDEN' },
        //   });
        // }

        // Input validation
        if (!id || !newPassword) {
          throw new GraphQLError("User ID and new password are required", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        if (newPassword.length < 8) {
          throw new GraphQLError("Password must be at least 8 characters", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check if user exists
        const [user] = await getUsers({ id, limit: 1 });
        if (!user) {
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt();
        const hashedPwd = await bcrypt.hash(newPassword, salt);

        // Update user password
        await saveData({
          table: "users",
          data: {
            password_hash: hashedPwd,
            updated_at: new Date(),
          },
          id: id,
          connection: connection,
        });

        await connection.commit();

        // Invalidate all existing sessions/tokens for this user (recommended)
        // Implement your session invalidation logic here if needed

        return {
          success: true,
          message: "Password reset successfully",
        };
      } catch (error) {
        if (connection) {
          await connection.rollback();
        }

        // Handle specific errors
        if (error instanceof GraphQLError) {
          throw error;
        }

        console.error("Password reset error:", error);
        throw new GraphQLError("Failed to reset password", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      } finally {
        if (connection) {
          connection.release();
        }
      }
    },
    deleteUser: async (parent, args, context) => {
      const { user_id } = args;
      try {
        // Input validation
        if (!user_id) {
          throw new GraphQLError("User ID is required", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        // Check if user exists and isn't already deleted
        const [user] = await getUsers({ id: user_id, limit: 1 });

        if (!user) {
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        if (user.deleted) {
          throw new GraphQLError("User is already deleted", {
            extensions: { code: "CONFLICT" },
          });
        }

        // Perform soft delete
        await saveData({
          table: "users",
          data: {
            deleted: true,
            updated_at: new Date(),
          },
          id: user_id,
        });

        return {
          success: true,
          message: "User account deactivated successfully",
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }

        console.error("User deletion error:", error);
        throw new GraphQLError("Failed to deactivate user account");
      }
    },
  },
};

export default userResolvers;
