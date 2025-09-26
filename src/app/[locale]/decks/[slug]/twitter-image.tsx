import deckTwitterImage, {
  size as deckTwitterImageSize,
  contentType as deckTwitterImageContentType,
} from "../../../decks/[slug]/twitter-image";

export const runtime = "nodejs";
export const size = deckTwitterImageSize;
export const contentType = deckTwitterImageContentType;

export default deckTwitterImage;
