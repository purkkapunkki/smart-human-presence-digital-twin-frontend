export default function Home() {
  return (
    <>
      <main className="min-h-screen flex items-center justify-center">
        <div className="shadow-lg w-fit mx-auto p-5 rounded-[var(--rounded-corners)]">
          <form action="" method="get" className="flex flex-col gap-0.5">
            <section className=" flex flex-col mb-2">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                className=" border border-gray-300 rounded-[var(--rounded-corners)] p-2"
              />
            </section>
            <section className="flex flex-col mb-2">
              <label htmlFor="avatar-color">Avatar color</label>
              <input
                type="color"
                id="avatar-color"
                name="avatar-color"
                className="border border-gray-300 rounded-[var(--rounded-corners)] p-2 cursor-pointer"
              />
            </section>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-[var(--rounded-corners)] hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Log in
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
