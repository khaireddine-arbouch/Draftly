"use client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export interface MoodBoardImage {
  id: string; // Unique ID for the image
  components?: string[]; // Optional components list
  list?: string[]; // Optional list of related items
  projects?: string[]; // Optional related projects
  file?: File; // Optional file (for server-loaded images)
  preview: string; // Local preview URL or Convex URL for the image
  storageId?: string; // Optional storage ID for the image
  uploaded: boolean; // Flag indicating if the image is uploaded
  uploading: boolean; // Flag indicating if the image is currently uploading
  error?: string; // Optional error message (if any)
  url?: string; // Convex URL for uploaded images
  isFromServer?: boolean; // Flag indicating if the image came from the server
}

interface StylesFormData {
  images: MoodBoardImage[];
}

export const useMoodBoard = (guideImages: MoodBoardImage[]) => {
  const [dragActive, setDragActive] = useState(false);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const form = useForm<StylesFormData>({
    defaultValues: {
      images: [],
    },
  });
  const { watch, setValue, getValues } = form;
  const images = watch("images");

  const generateUploadUrl = useMutation(api.moodboard.generateUploadUrl);
  const removeMoodBoardImage = useMutation(api.moodboard.removeMoodBoardImage);
  const addMoodBoardImage = useMutation(api.moodboard.addMoodBoardImage);

  const uploadImage = async (
    file: File
  ): Promise<{ storageId: string; url?: string }> => {
    try {
      // Get the upload URL (assuming `generateUploadUrl` returns a valid URL)
      const uploadUrl = await generateUploadUrl();

      // Perform the file upload via POST request
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Check if the response is successful (status code 2xx)
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Assuming the response contains a JSON object with storageId and url
      const {storageId} = await response.json();

      if(projectId) {
        await addMoodBoardImage({
          projectId: projectId as Id<"projects">,
          storageId: storageId as Id<"_storage">,
        });

      }

      return {storageId};
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image. Please try again.");
    }
  };

  useEffect(() => {
    // Check if guideImages exists and has elements
    if (guideImages && guideImages.length > 0) {
      // Map guideImages to the serverImages format
      const serverImages: MoodBoardImage[] = guideImages.map((img: any) => ({
        id: img.id,
        preview: img.url,
        storageId: img.storageId,
        uploaded: true,
        uploading: false,
        url: img.url,
        isFromServer: true,
      }));

      // Get current images from form values (assuming `getValues` is from a form hook like `react-hook-form`)
      const currentImages = getValues("images");

      // If there are no current images, set the server images as the value for 'images'
      if (currentImages.length === 0) {
        setValue("images", serverImages);
      } else {
        const mergedImages = [...currentImages]; // Create a copy of currentImages

        serverImages.forEach((serverImg) => {
          // Find the client image with the matching storageId
          const clientIndex = mergedImages.findIndex(
            (clientImg) => clientImg.storageId === serverImg.storageId
          );

          if (clientIndex !== -1) {
            // Clean up old blob URL if it exists
            if (mergedImages[clientIndex].preview.startsWith("blob:")) {
              URL.revokeObjectURL(mergedImages[clientIndex].preview);
            }

            // Replace with server image
            mergedImages[clientIndex] = {
              ...mergedImages[clientIndex],
              ...serverImg,
            };
          }
        });

        setValue("images", mergedImages);
      }
    }
  }, [guideImages, getValues, setValue]);

  const addImage = (file: File) => {
    if (images.length >= 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const newImage: MoodBoardImage = {
      id: `${Date.now()}-${Math.random()}`, // Fix template string syntax
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
      uploading: false,
      isFromServer: false,
    };

    // Create a new array with the updated image list
    const updatedImages = [...images, newImage];

    // Update the state (assuming you're using React state)
    setValue("images", updatedImages);

    toast.success("Image added to the mood board");
  };

  const removeImage = async (imageId: string) => {
    const imageToRemove = images.find((img) => img.id === imageId);
    if (!imageToRemove) {
      return;
    }
    // If it's a server image with stoogeld, remove from Convex
    if (imageToRemove.isFromServer && imageToRemove.storageId && projectId) {
      try {
        await removeMoodBoardImage({
          projectId: projectId as Id<"projects">,
          storageId: imageToRemove.storageId as Id<"_storage">,
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to remove image from server");
        return;
      }
    }

    const updatedImages = images.filter((img) => {
      if (img.id === imageId) {
        if (!img.isFromServer && img.preview.startsWith("blob:")) {
          URL.revokeObjectURL(img.preview);
        }
        return false;
      }
      return true;
    });

    setValue("images", updatedImages);
    toast.success("Image removed from the mood board");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const ImageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (ImageFiles.length === 0) {
      toast.error("Please drop only image files");
      return;
    }

    ImageFiles.forEach((file) => {
      if (images.length >= 5) {
        toast.error("Maximum 5 images allowed");
        return;
      }
      addImage(file);
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => addImage(file));

    // Reset the file input
    e.target.value = "";
  };

  useEffect(() => {
    const uploadPendingImages = async () => {
      const currentImages = getValues("images"); // Assuming `getValues` gets the current state

      // Loop through images and check if they need to be uploaded
      for (let i = 0; i < currentImages.length; i++) {
        const image = currentImages[i];

        if (!image.uploaded && !image.uploading && !image.error) {
          // Mark the image as uploading
          const updatedImages = [...currentImages];
          updatedImages[i] = { ...image, uploading: true };
          setValue("images", updatedImages); // Update the state with the new value

          try {
            // Upload the image and get the storageId
            const {storageId} = await uploadImage(image.file!);
            const finalImages = getValues("images");

            const finalIndex = finalImages.findIndex((img) => img.id === image.id);
            if (finalIndex !== -1) {
              finalImages[finalIndex] = { ...finalImages[finalIndex], uploaded: true, uploading: false, storageId, isFromServer: true };
              setValue("images", [...finalImages]);
            }
          } catch (error) {
            console.error("Error uploading image:", error);
            const errorImages = getValues("images");
            const errorIndex = errorImages.findIndex((img) => img.id === image.id);
            if (errorIndex !== -1) {
              errorImages[errorIndex] = { ...errorImages[errorIndex], uploading: false, error: 'Failed to upload image. Please try again.' };
              setValue("images", [...errorImages]);
            }
            toast.error("Failed to upload image. Please try again.");
          }
        }
      }
    };

    // Only run if there are images to upload
    if (images.length > 0) {
      uploadPendingImages();
    }
  }, [getValues, setValue, images]); // Dependency array to re-run on images change

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (!img.isFromServer && img.preview.startsWith("blob:")) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };

  }, []);

  return {
    form,
    images,
    addImage,
    removeImage,
    handleDrag,
    handleDrop,
    handleFileInput,
    dragActive,
    canAddMore: images.length < 5,
  }
};
