import { Button } from "antd";

const AddLessonForm = ({
  values,
  setValues,
  handleAddLesson,
  uploading,
  uploadButtonText,
  handleVideo,
}) => {
  return (
    <div className="container pt-3">
      <form onSubmit={handleAddLesson}>
        <input
          type="text"
          className="form-control square"
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          placeholder="주제"
          autoFocus
          required
        />

        <textarea
          className="form-control mt-3"
          cols="7"
          rows="7"
          onChange={(e) => setValues({ ...values, content: e.target.value })}
          value={values.content}
          placeholder="내용"
        ></textarea>

        <label className="btn btn-dark w-100 text-left mt-3">
          {uploadButtonText}
          <input onChange={handleVideo} type="file" accept="video/*" hidden />
        </label>

        <Button
          onClick={handleAddLesson}
          className="col mt-3"
          size="large"
          type="primary"
          loading={uploading}
          shape="round"
        >
          저장하기
        </Button>
      </form>
    </div>
  );
};

export default AddLessonForm;
