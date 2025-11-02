"use strict";
const { Model, DataTypes } = require("sequelize");
const bcryptjs = require("bcryptjs");

module.exports = (sequelize) => {
  class User extends Model {
    /**
     * Метод для проверки пароля
     */
    async checkPassword(password) {
      return await bcryptjs.compare(password, this.password);
    }

    /**
     * Helper method for defining associations.
     */
    static associate(models) {
      // Связь с корзиной: один пользователь может иметь много товаров в корзине
      User.hasMany(models.CartItem, {
        foreignKey: "userId",
        as: "cartItems",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [6, 255],
        },
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      hooks: {
        // Хэшируем пароль перед сохранением
        beforeCreate: async (user) => {
          if (user.password) {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
            const salt = await bcryptjs.genSalt(saltRounds);
            user.password = await bcryptjs.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
            const salt = await bcryptjs.genSalt(saltRounds);
            user.password = await bcryptjs.hash(user.password, salt);
          }
        },
      },
    }
  );

  return User;
};
