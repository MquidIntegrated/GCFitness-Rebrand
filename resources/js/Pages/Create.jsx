import { Head, useForm } from "@inertiajs/react";
import { useRoute } from "../../../vendor/tightenco/ziggy";

export default function Create() {
    const route = useRoute();

    const { data, setData, post, errors, processing } = useForm({
        body: "",
    });

    function submit(e) {
        e.preventDefault();
        post("/posts");
    }
    console.log(errors);

    return (
        <>
            <Head title="Create" />
            <h1 className="title">Create New Post</h1>
            {/* {data.body} */}
            <div className="w-1/2 mx-auto">
                <form action="" onSubmit={submit}>
                    <textarea
                        name=""
                        id=""
                        rows="10"
                        value={data.body}
                        onChange={(e) => setData("body", e.target.value)}
                        className={errors.body && "!ring-red-500"}
                    ></textarea>
                    {errors.body && <p className="error">{errors.body}</p>}
                    <button className="primary-btn mt-4" disabled={processing}>
                        Create Post
                    </button>
                </form>
            </div>
        </>
    );
}
