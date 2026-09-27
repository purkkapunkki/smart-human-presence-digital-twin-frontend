export default function Home() {
  return (
    <>
      <div className="flex items-center justify-center shadow-lg w-fit mx-auto p-3 rounded-[var(--rounded-corners)]">
        <form action="" method="get" className="flex flex-col gap-2">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            className=" border border-gray-300 rounded-[var(--rounded-corners)] p-2"
          />
          <label htmlFor="avatar-color">Avatar color</label>
          <input
            type="color"
            id="avatar-color"
            name="avatar-color"
            className="border border-gray-300 rounded-[var(--rounded-corners)] p-2 cursor-pointer"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-[var(--rounded-corners)] hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </form>
      </div>
    </>
  );
}
