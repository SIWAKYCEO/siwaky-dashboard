/** Bundled product photography — resolves at build time so `next/image` always has a reliable src (avoids 404/`/_next/image` edge issues). OG meta still uses `/images/product.jpg`. */
import productPhoto from "../../public/images/product.jpg";

export default productPhoto;
