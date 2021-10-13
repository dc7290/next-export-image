/* eslint-disable @typescript-eslint/no-var-requires */
import Head from 'next/head'
import { DetailedHTMLProps, ImgHTMLAttributes } from 'react'
import { useInView } from 'react-intersection-observer'

type ImgElementStyle = NonNullable<JSX.IntrinsicElements['img']['style']>

type PlaceholderValue = 'blur' | 'empty'

type OnLoadingComplete = (result: { naturalWidth: number; naturalHeight: number }) => void

type Props = {
  src: string
  layout?: 'responsive' | 'fill'
  loading?: 'lazy' | 'eager'
  priority?: boolean
  placeholder?: PlaceholderValue
  onLoadingComplete?: OnLoadingComplete
  wrapperClassName?: string
  objectFit?: ImgElementStyle['objectFit']
  objectPosition?: ImgElementStyle['objectPosition']
  lazyBoundary?: `${number}px`
} & Omit<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
  'width' | 'height' | 'srcSet' | 'ref' | 'decoding'
>

const loadedImageURLs = new Set<string>()
const emptyDataURL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const handleLoading = (
  img: HTMLImageElement | null,
  src: string,
  placeholder: PlaceholderValue,
  onLoadingComplete?: OnLoadingComplete
) => {
  if (!img) {
    return
  }

  const handleLoad = () => {
    if (img.src !== emptyDataURL) {
      const p = 'decode' in img ? img.decode() : Promise.resolve()
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      p.catch(() => {}).then(() => {
        if (placeholder === 'blur') {
          img.style.filter = 'none'
          img.style.backgroundSize = 'none'
          img.style.backgroundImage = 'none'
        }
        loadedImageURLs.add(src)
        if (onLoadingComplete) {
          const { naturalWidth, naturalHeight } = img
          onLoadingComplete({ naturalWidth, naturalHeight })
        }
      })
    }
  }
  if (img.complete) {
    handleLoad()
  } else {
    img.onload = handleLoad
  }
}

const ExportImage = ({
  src,
  alt,
  sizes,
  layout = 'responsive',
  priority = false,
  loading,
  lazyBoundary = '200px',
  className,
  wrapperClassName,
  onLoadingComplete,
  placeholder = 'empty',
  objectFit,
  objectPosition,
  ...imgProps
}: Props) => {
  let isLazy = !priority && (loading === 'lazy' || typeof loading === 'undefined')
  if (typeof window !== 'undefined' && loadedImageURLs.has(src)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isLazy = false
  }

  if (process.env.NODE_ENV !== 'production') {
    if (priority && loading === 'lazy') {
      throw new Error(
        `Image with src "${src}" has both "priority" and "loading='lazy'" properties. Only one should be used.`
      )
    }
  }

  const srcData = require(`~/src/images/${src}`)
  const { placeholder: blurDataURL, width, height, srcSet, src: outSrc } = srcData
  const serSetWebp = require(`~/src/images/${src}?format=webp`).srcSet

  const { ref, inView } = useInView({ rootMargin: lazyBoundary, triggerOnce: true, skip: !isLazy })
  const isVisible = !isLazy || inView

  let wrapperStyle: JSX.IntrinsicElements['div']['style'] | undefined
  let sizerStyle: JSX.IntrinsicElements['div']['style'] | undefined
  const imgStyle: ImgElementStyle | undefined = {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,

    boxSizing: 'border-box',
    padding: 0,
    border: 'none',
    margin: 'auto',

    display: 'block',
    width: 0,
    height: 0,
    minWidth: '100%',
    maxWidth: '100%',
    minHeight: '100%',
    maxHeight: '100%',

    objectFit,
    objectPosition,
  }
  const blurStyle =
    placeholder === 'blur'
      ? {
          filter: 'blur(20px)',
          backgroundSize: objectFit ?? 'cover',
          backgroundImage: `url("${blurDataURL}")`,
          backgroundPosition: objectPosition ?? '0% 0%',
        }
      : {}
  if (layout === 'fill') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    wrapperStyle = {
      display: 'block',
      overflow: 'hidden',

      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,

      boxSizing: 'border-box',
      margin: 0,
    }
  } else if (layout === 'responsive') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    wrapperStyle = {
      display: 'block',
      overflow: 'hidden',
      position: 'relative',

      boxSizing: 'border-box',
      margin: 0,
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sizerStyle = { display: 'block', boxSizing: 'border-box', paddingTop: `calc(${height} / ${width} * 100%)` }
  }

  let imgAttributes: {
    src: string
    srcSet?: string
    serSetWebp?: string
    sizes?: string
  } = {
    src: emptyDataURL,
    srcSet: undefined,
    serSetWebp: undefined,
    sizes: undefined,
  }

  if (isVisible) {
    imgAttributes = {
      src: outSrc,
      srcSet,
      serSetWebp,
      sizes,
    }
  }

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      {sizerStyle && <div style={sizerStyle} />}
      <picture>
        <source srcSet={imgAttributes.serSetWebp} type="image/webp" />
        <img
          {...imgProps}
          src={imgAttributes.src}
          srcSet={imgAttributes.srcSet}
          sizes={imgAttributes.sizes}
          decoding="async"
          className={className}
          ref={(img) => {
            ref(img)
            handleLoading(img, outSrc, placeholder, onLoadingComplete)
          }}
          style={{ ...imgStyle, ...blurStyle }}
          alt={alt}
        />
      </picture>
      <noscript>
        <img
          {...imgProps}
          src={outSrc}
          srcSet={srcSet}
          sizes={sizes}
          decoding="async"
          style={imgStyle}
          className={className}
          loading={loading ?? 'lazy'}
          alt={alt}
        />
      </noscript>

      {priority ? (
        // Note how we omit the `href` attribute, as it would only be relevant
        // for browsers that do not support `imagesrcset`, and in those cases
        // it would likely cause the incorrect image to be preloaded.
        //
        // https://html.spec.whatwg.org/multipage/semantics.html#attr-link-imagesrcset
        <Head>
          <link
            key={'__nimg-' + imgAttributes.src + imgAttributes.srcSet + imgAttributes.sizes}
            rel="preload"
            as="image"
            href={imgAttributes.srcSet ? undefined : imgAttributes.src}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: imagesrcset is not yet in the link element type.
            imagesrcset={imgAttributes.srcSet}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: imagesizes is not yet in the link element type.
            imagesizes={imgAttributes.sizes}
          ></link>
        </Head>
      ) : null}
    </div>
  )
}

export default ExportImage
