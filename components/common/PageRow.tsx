import { PageItem } from "@/app/types/pageInterface";
import { Pencil, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  page: PageItem;
}

export const PageRow: React.FC<Props> = ({ page }) => {
  const router = useRouter();
  const deletePage = async () => {
    const res = await fetch(`/api/pages/${page._id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Page Delected Successfully");
      router.refresh();
    }
  };
  const confirmDelete = () => {
    toast.warning("Are you sure you want to delete this page?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => deletePage(),
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(),
      },
    });
  };
  return (
    <div className="grid grid-cols-5 items-center p-4 bg-[#111827] rounded-lg text-white">
      <div className="flex items-center gap-2">
        <span>{page.pageTitle}</span>
      </div>

      {/* Author */}
      <p className="text-gray-300">{page.author.username}</p>

      {/* Status */}
      <span
        className={`px-3 py-1 text-xs rounded-full w-fit ${
          page.status === "published"
            ? "bg-green-700 text-green-200"
            : "bg-yellow-700 text-yellow-200"
        }`}
      >
        {page.status}
      </span>

      {/* Last Modified */}
      <p className="text-gray-400 text-sm">
        {new Date(page.updatedAt).toLocaleString()}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="hover:text-blue-400">
          <Pencil
            size={18}
            onClick={() => {
              router.push(`/dashboard/pages/edit-page/${page._id}`);
            }}
          />
        </button>
        <button className="hover:text-red-400">
          <Trash size={18} onClick={() => confirmDelete()} />
        </button>
      </div>
    </div>
  );
};
