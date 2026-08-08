import {
  useEffect,
  useState,
} from "react";

import {
  isStoredPhotoReference,
  loadPhotoBlob,
} from "../engine/mediaStorage";

type MediaUrlState = {
  reference?: string;
  url?: string;
  error: boolean;
};

export function useMediaUrl(
  reference?: string
): Omit<MediaUrlState, "reference"> & { loading: boolean } {
  const [state, setState] = useState<MediaUrlState>(() => ({
    reference: undefined,
    url: undefined,
    error: false,
  }));

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    if (!reference || !isStoredPhotoReference(reference)) {
      return;
    }

    void loadPhotoBlob(reference)
      .then((blob) => {
        if (cancelled) {
          return;
        }

        if (!blob) {
          setState({
            reference,
            url: undefined,
            error: true,
          });
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setState({
          reference,
          url: objectUrl,
          error: false,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            reference,
            url: undefined,
            error: true,
          });
        }
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [reference]);

  if (!reference) {
    return {
      url: undefined,
      loading: false,
      error: false,
    };
  }

  if (!isStoredPhotoReference(reference)) {
    return {
      url: reference,
      loading: false,
      error: false,
    };
  }

  return {
    url:
      state.reference === reference
        ? state.url
        : undefined,
    loading: state.reference !== reference,
    error:
      state.reference === reference
        ? state.error
        : false,
  };
}
