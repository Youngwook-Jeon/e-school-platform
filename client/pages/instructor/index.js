import axios from "axios";
import InstructorRoute from "../../components/routes/InstructorRoute";

const InstructorIndex = () => {
  return (
    <InstructorRoute>
      <h1 className="jumbotron text-center square">선생님 대시보드</h1>
    </InstructorRoute>
  );
};

export default InstructorIndex;