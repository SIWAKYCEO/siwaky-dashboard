"use client";



import { useLayoutEffect } from "react";



const BODY_CLASS = "dashboard-route";



/**

 * Storefront root layout stays `lang="ar" dir="rtl"`. While on `/dashboard`, force a

 * predictable LTR reading context for the whole document + add a body hook for CSS.

 */

export function DashboardHtmlLock() {

  useLayoutEffect(() => {

    const html = document.documentElement;

    const body = document.body;

    const prevDir = html.getAttribute("dir");

    const prevLang = html.getAttribute("lang");

    const prevOverflow = body.style.overflowX;



    html.setAttribute("dir", "ltr");

    html.setAttribute("lang", "en");

    body.style.overflowX = "hidden";

    body.classList.add(BODY_CLASS);



    return () => {

      if (prevDir == null) html.removeAttribute("dir");

      else html.setAttribute("dir", prevDir);

      if (prevLang == null) html.removeAttribute("lang");

      else html.setAttribute("lang", prevLang);

      body.style.overflowX = prevOverflow;

      body.classList.remove(BODY_CLASS);

    };

  }, []);



  return null;

}

