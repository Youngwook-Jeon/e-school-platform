import { useState, useEffect } from "react";
import axios from "axios";
import InstructorRoute from "../../../../components/routes/InstructorRoute";
import CourseCreateForm from "../../../../components/forms/CourseCreateForm";
import Resizer from "react-image-file-resizer";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { List, Avatar } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const EditCourse = () => {
  const [values, setValues] = useState({
    name: "",
    description: "",
    price: "10000",
    uploading: false,
    paid: true,
    category: "",
    loading: false,
    lessons: [],
  });

  const [image, setImage] = useState({});
  const [preview, setPreview] = useState("");
  const [uploadButtonText, setUploadButtonText] = useState("이미지 업로드하기");

  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    loadCourse();
  }, []);

  const loadCourse = async () => {
    const { data } = await axios.get(`/api/course/${slug}`);
    if (data) setValues(data);
    if (data && data.image) setImage(data.image);
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    let file = e.target.files[0];
    setPreview(window.URL.createObjectURL(file));
    setUploadButtonText(file.name);
    setValues({ ...values, loading: true });

    Resizer.imageFileResizer(file, 720, 500, "JPEG", 100, 0, async (uri) => {
      try {
        let { data } = await axios.post("/api/course/upload-image", {
          image: uri,
        });
        console.log(data);
        setImage(data);
        setValues({ ...values, loading: false });
      } catch (err) {
        setValues({ ...values, loading: false });
        toast.error("이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
      }
    });
  };

  const handleImageRemove = async () => {
    setValues({ ...values, loading: true });
    try {
      const res = await axios.post("/api/course/remove-image", { image });
      setImage({});
      setPreview("");
      setUploadButtonText("이미지 업로드하기");
      setValues({ ...values, loading: false });
    } catch (err) {
      setValues({ ...values, loading: false });
      toast.error("이미지 삭제가 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(`/api/course/${slug}`, {
        ...values,
        image,
      });
      toast.success("강좌가 성공적으로 업데이트되었습니다.");
    } catch (err) {
      toast.error(err.response.data);
    }
  };

  const handleDrag = (e, index) => {
    e.dataTransfer.setData("itemIndex", index);
  };

  const handleDrop = async (e, index) => {
    const movingItemIndex = e.dataTransfer.getData("itemIndex");
    const targetItemIndex = index;
    let allLessons = values.lessons;
    let movingItem = allLessons[movingItemIndex];
    allLessons.splice(movingItemIndex, 1); // remove 1 item from the given index
    allLessons.splice(targetItemIndex, 0, movingItem);

    setValues({ ...values, lessons: [...allLessons] });

    const { data } = await axios.put(`/api/course/${slug}`, {
      ...values,
      image,
    });
    toast.success("강의가 재정렬되었습니다.");
  };

  const handleDelete = async (index) => {
    const answer = window.confirm("정말로 이 강의를 삭제하시겠습니까?");
    if (!answer) return;
    let allLessons = values.lessons;
    const removed = allLessons.splice(index, 1);
    setValues({ ...values, lessons: allLessons });
    const { data } = await axios.put(`/api/course/${slug}/${removed[0]._id}`);

  }

  return (
    <InstructorRoute>
      <h1 className="jumbotron text-center square">강좌 업데이트</h1>

      <div className="pt-3 pb-3">
        <CourseCreateForm
          handleSubmit={handleSubmit}
          handleImage={handleImage}
          handleChange={handleChange}
          values={values}
          setValues={setValues}
          preview={preview}
          uploadButtonText={uploadButtonText}
          handleImageRemove={handleImageRemove}
          editPage={true}
        />
      </div>
      <hr />

      <div className="row pb-5">
        <div className="col lesson-list">
          <h4>{values && values.lessons && values.lessons.length} 강의들</h4>

          <List
            onDragOver={(e) => e.preventDefault()}
            itemLayout="horizontal"
            dataSource={values && values.lessons}
            renderItem={(item, index) => (
              <List.Item
                draggable
                onDragStart={(e) => handleDrag(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              >
                <List.Item.Meta
                  avatar={<Avatar>{index + 1}</Avatar>}
                  title={item.title}
                ></List.Item.Meta>

                <DeleteOutlined
                  onClick={() => handleDelete(index)}
                  className="text-danger float-right"
                />
              </List.Item>
            )}
          ></List>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default EditCourse;
