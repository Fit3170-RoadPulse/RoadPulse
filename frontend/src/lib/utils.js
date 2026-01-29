import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const setCookie = (name, value, days) => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    const isSecure = window.location.protocol === "https:";

    document.cookie = `
        ${name}=${value};
        expires=${expirationDate.toUTCString()};
        path=/;
        SameSite=Lax;
        ${isSecure ? "Secure;" : ""}
    `;
};

export const getCookie = (name) => {
    return document.cookie
        .split("; ")
        .reduce((acc, cookie) => {
            const [key, ...val] = cookie.split("=");
            if (key === name) acc = val.join("=");
            return acc;
        }, null);
};
