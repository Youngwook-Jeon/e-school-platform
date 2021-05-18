import Link from "next/link";

const InstructorNav = () => {
  return (
    <div className="nav flex-column nav-pills mt-2">
      <Link href="/instructor">
        <a className="nav-link active">대시보드</a>
      </Link>

      <Link href="/instructor/course/create">
        <a className="nav-link">강의 만들기</a>
      </Link>
    </div>
  );
};

export default InstructorNav;
