import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import Course from "../models/course";
import slugify from "slugify";
import { readFileSync } from "fs";

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const S3 = new AWS.S3(awsConfig);

export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).send("전송된 이미지가 없습니다.");

    const base64Data = new Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const type = image.split(";")[0].split("/")[1]; // format type of image

    const params = {
      Bucket: "eschool-bucket",
      Key: `${nanoid()}.${type}`,
      Body: base64Data,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: `image/${type}`,
    };

    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }

      console.log(data);
      res.send(data);
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send("에러가 발생했습니다. 다시 시도해 주세요.");
  }
};

export const removeImage = async (req, res) => {
  try {
    const { image } = req.body;
    const params = {
      Bucket: image.Bucket,
      Key: image.Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      }

      res.send({ ok: true });
    });
  } catch (err) {
    console.log(err);
  }
};

export const create = async (req, res) => {
  try {
    const alreadyExistCourse = await Course.findOne({
      slug: slugify(req.body.name.toLowerCase()),
    });
    if (alreadyExistCourse)
      return res.status(400).send("이미 존재하는 강좌 이름입니다.");

    const course = await new Course({
      slug: slugify(req.body.name),
      instructor: req.user._id,
      ...req.body,
    }).save();

    res.json(course);
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .send("강좌 개설이 실패했습니다. 다시 시도해 주세요.");
  }
};

export const read = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug })
      .populate("instructor", "_id name")
      .exec();
    res.json(course);
  } catch (err) {
    console.log(err);
  }
};

export const uploadVideo = async (req, res) => {
  try {
    if (req.user._id != req.params.instructorId) {
      return res.status(400).send("접근 권한이 없습니다.");
    }
    const { video } = req.files;
    if (!video) return res.status(400).send("비디오 파일이 없습니다.");

    const params = {
      Bucket: "eschool-bucket",
      Key: `${nanoid()}.${video.type.split("/")[1]}`,
      Body: readFileSync(video.path),
      ACL: "public-read",
      ContentType: video.type,
    };

    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }

      console.log(data);
      return res.send(data);
    });
  } catch (err) {
    console.log(err);
  }
};

export const removeVideo = async (req, res) => {
  try {
    if (req.user._id != req.params.instructorId) {
      return res.status(400).send("접근 권한이 없습니다.");
    }
    const { Bucket, Key } = req.body;

    const params = {
      Bucket,
      Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }

      console.log(data);
      return res.send({ ok: true });
    });
  } catch (err) {
    console.log(err);
  }
};

export const addLesson = async (req, res) => {
  try {
    const { slug, instructorId } = req.params;
    const { title, content, video } = req.body;

    if (req.user._id != instructorId) {
      return res.status(400).send("접근 권한이 없습니다.");
    }

    const updated = await Course.findOneAndUpdate(
      { slug },
      {
        $push: { lessons: { title, content, video, slug: slugify(title) } },
      },
      { new: true }
    )
      .populate("instructor", "_id name")
      .exec();

    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send("강의 추가에 실패했습니다.");
  }
};

export const update = async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug }).exec();
    if (req.user._id != course.instructor) {
      return res.status(400).send("접근 권한이 없습니다.");
    }

    const updated = await Course.findOneAndUpdate({ slug }, req.body, {
      new: true,
    }).exec();

    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const removeLesson = async (req, res) => {
  const { slug, lessonId } = req.params;
  const course = await Course.findOne({ slug }).exec();
  if (req.user._id != course.instructor) {
    return res.status(400).send("접근 권한이 없습니다.");
  }

  await Course.findByIdAndUpdate(course._id, {
    $pull: { lessons: { _id: lessonId } },
  }).exec();

  res.json({ ok: true });
};

export const updateLesson = async (req, res) => {
  try {
    const { slug } = req.params;
    const { _id, title, content, video, free_preview } = req.body;
    const course = await Course.findOne({ slug }).select("instructor").exec();

    if (course.instructor._id != req.user._id) {
      return res.status(400).send("접근 권한이 없습니다.");
    }

    const updated = await Course.updateOne(
      { "lessons._id": _id },
      {
        $set: {
          "lessons.$.title": title,
          "lessons.$.content": content,
          "lessons.$.video": video,
          "lessons.$.free_preview": free_preview,
        },
      },
      { new: true }
    ).exec();

    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("강의 업데이트가 실패했습니다.");
  }
};

export const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select("instructor").exec();
    if (course.instructor._id != req.user._id) {
      return res.status(400).send("접근 권한이 없습니다.");
    }

    const updated = await Course.findByIdAndUpdate(
      courseId,
      { published: true },
      { new: true }
    ).exec();
    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send("퍼블리시에 실패했습니다.");
  }
};

export const unpublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select("instructor").exec();
    if (course.instructor._id != req.user._id) {
      return res.status(400).send("접근 권한이 없습니다.");
    }

    const updated = await Course.findByIdAndUpdate(
      courseId,
      { published: false },
      { new: true }
    ).exec();
    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send("강의를 닫는것에 실패했습니다.");
  }
};

export const courses = async (req, res) => {
  const allCourses = await Course.find({ published: true })
    .populate("instructor", "_id name")
    .exec();
  res.json(allCourses);
};
