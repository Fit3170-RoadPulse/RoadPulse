import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const setCookie = (name, value, days) => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    document.cookie = `${name}=${value}; expires=${expirationDate.toUTCString()}; path=/`;
};

export const getCookie = (name) => {
    const cookies = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`));
    return cookies ? cookies.split("=")[1] : null;
};
