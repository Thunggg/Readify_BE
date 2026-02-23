import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { handleErrorApi } from "@/lib/utils";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";

export function AvatarDemo({ src, setFile }: { src: string, setFile: (file: File) => void }) {
    const [previewUrl, setPreviewUrl] = useState<string>(src ?? "https://i.pinimg.com/736x/32/f0/11/32f0110217403ff57f98847cb7094db4.jpg");


    const inputRef = useRef<HTMLInputElement>(null);

    const openFilePicker = () => {
        // nếu inputRef.current không phải là null (do chưa render xong) thì click vào input
        if (inputRef.current) {
            inputRef.current.click();
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(!e.target.files?.[0]) return; // Nếu file ko tồn tại thì bỏ
        if(!e.target.files?.[0].type.startsWith("image/")){ // Nếu file ko là ảnh thì bỏ qua
            handleErrorApi({
                error: "File không phải là ảnh",
                duration: 5000,
            });
            return;
        }
        if(e.target.files?.[0].size > 2 * 1024 * 1024){ // Nếu file lớn hơn 2MB thì bỏ qua
            handleErrorApi({
                error: "File quá lớn. Kích thước tối đa là 2MB",
                duration: 5000,
            });
            return;
        }

        const previewUrl = URL.createObjectURL(e.target.files?.[0]);
        setPreviewUrl(previewUrl);
        setFile(e.target.files?.[0]);
    }

  return (
    <div className="flex items-center gap-12">
      <button
        type="button"
        className="relative cursor-pointer group"
        onClick={openFilePicker}
      >
        {/* Avatar */}
        <Avatar className="h-32 w-32">
          <AvatarImage
            src={previewUrl}
            alt="avatar"
            className="group-hover:blur-sm"
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>

        {/* overlay */}
        {/* inset-0 la phu kien toan bo avatar */}
        {/* phai them group hover de an hien overlay */}
        <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity duration-200">
            <Camera className="h-6 w-6 text-white" />
        </div>

        {/* input file */}
        <input type="file" className="hidden" ref={inputRef} onChange={handleFileChange} />
      </button>
    </div>
  );
}
