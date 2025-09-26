import deckOpenGraphImage, {
  size as deckOpenGraphImageSize,
  contentType as deckOpenGraphImageContentType,
} from "../../../decks/[slug]/opengraph-image";

export const runtime = "nodejs";
export const size = deckOpenGraphImageSize;
export const contentType = deckOpenGraphImageContentType;

export default deckOpenGraphImage;
