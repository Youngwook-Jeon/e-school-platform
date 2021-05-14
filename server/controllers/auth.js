import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";
import jwt from "jsonwebtoken";
import user from "../models/user";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // validation
    if (!name) return res.status(400).send("이름을 입력하세요.");
    if (!password || password.length < 6) {
      return res.status(400).send("비밀번호는 최소 6글자여야 합니다.");
    }
    let userInDb = await User.findOne({ email }).exec();
    if (userInDb) return res.status(400).send("이미 사용중인 이메일입니다.");

    const hashedPassword = await hashPassword(password);
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("에러가 발생했습니다. 다시 시도하여 주세요.");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userInDb = await User.findOne({ email }).exec();
    if (!userInDb) return res.status(400).send("존재하지 않는 유저입니다.");

    const match = await comparePassword(password, userInDb.password);

    if (!match) return res.status(400).send("비밀번호가 일치하지 않습니다.");

    // create signed jwt
    const token = jwt.sign({ _id: userInDb._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    userInDb.password = undefined;
    res.cookie("token", token, {
      httpOnly: true,
      // secure: true, // only works on https
    });
    res.json(userInDb);
  } catch (err) {
    console.log(err);
    return res.status(400).send("에러가 발생했습니다. 다시 시도하여 주세요.");
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ message: "로그아웃되었습니다." });
  } catch (err) {
    console.log(err);
    return res.status(400).send("에러가 발생했습니다. 다시 시도하여 주세요.");
  }
};

export const currentUser = async (req, res) => {
  try {
    const userInDb = await User.findById(req.user._id)
      .select("-password")
      .exec();
    return res.json(userInDb);
  } catch (err) {
    console.log(err);
  }
};
