import db from "../db/knex.js";

const UserModel = {
  async create(userData) {
    // Insert user data and retrieve the inserted user's ID
    await db("users").insert(userData); // Perform the insert operation

    // Retrieve the inserted user by unique email to ensure we get the right user
    const user = await db("users").where({ email: userData.email }).first();
    return user;
  },

  async findByEmail(email) {
    const user = await db("users").where({ email }).first();
    return user;
  },

  async findById(id) {
    const user = await db("users").where({ id }).first();
    return user;
  },

  async findAll() {
    const users = await db("users");
    return users;
  },

  async updateUser(id, updateData) {
    await db("users").where({ id }).update(updateData);
    const user = await db("users").where({ id }).first();
    return user;
  },

  async deleteUser(id) {
    await db("users").where({ id }).del();
    return { message: "User deleted successfully" };
  },
};

export default UserModel;
