import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";

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
