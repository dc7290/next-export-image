/* eslint-disable @typescript-eslint/no-var-requires */
import Head from 'next/head'
import { DetailedHTMLProps, ImgHTMLAttributes } from 'react'
import { useInView } from 'react-intersection-observer'

const toBase64 = (str: string) => {
  if (typeof window === 'undefined') {
    return Buffer.from(str).toString('base64')
  } else {
    return window.btoa(str)
  }
}

const loadedImageURLs = new Set<string>()
const emptyDataURL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const VALID_LOADING_VALUES = ['lazy', 'eager', undefined] as const
type LoadingValue = typeof VALID_LOADING_VALUES[number]

const VALID_LAYOUT_VALUES = ['fill', 'fixed', 'intrinsic', 'responsive', undefined] as const
type LayoutValue = typeof VALID_LAYOUT_VALUES[number]

type PlaceholderValue = 'blur' | 'empty'

type OnLoadingComplete = (result: { naturalWidth: number; naturalHeight: number }) => void

type ImgElementStyle = NonNullable<JSX.IntrinsicElements['img']['style']>

type Props = {
  src: string
  layout?: LayoutValue
  priority?: boolean
  loading?: LoadingValue
  lazyBoundary?: string
  placeholder?: PlaceholderValue
  unoptimized?: boolean
  objectFit?: ImgElementStyle['objectFit']
  objectPosition?: ImgElementStyle['objectPosition']
  onLoadingComplete?: OnLoadingComplete
  wrapperClassName?: string
} & Omit<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
  'src' | 'srcSet' | 'ref' | 'width' | 'height' | 'loading' | 'style' | 'decoding'
>

const handleLoading = (
  img: HTMLImageElement | null,
  src: string,
  layout: LayoutValue,
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

      if (process.env.NODE_ENV !== 'production') {
        if (img.parentElement?.parentElement?.parentElement) {
          const parent = getComputedStyle(img.parentElement.parentElement?.parentElement)
          if (layout === 'responsive' && parent.display === 'flex') {
            console.warn(
              `Image with src "${src}" may not render properly as a child of a flex container. Consider wrapping the image with a div to configure the width.`
            )
          } else if (layout === 'fill' && parent.position !== 'relative') {
            console.warn(
              `Image with src "${src}" may not render properly with a parent using position:"${parent.position}". Consider changing the parent style to position:"relative" with a width and height.`
            )
          }
        }
      }
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
  sizes,
  alt,
  priority = false,
  loading,
  lazyBoundary = '200px',
  className,
  placeholder = 'empty',
  objectFit,
  objectPosition,
  onLoadingComplete,
  wrapperClassName,
  ...all
}: Props) => {
  const rest: Partial<Props> = all
  let layout: NonNullable<LayoutValue> = sizes ? 'responsive' : 'intrinsic'
  if ('layout' in rest) {
    if (rest.layout) layout = rest.layout

    delete rest['layout']
  }

  let isLazy = !priority && (loading === 'lazy' || typeof loading === 'undefined')
  if (typeof window !== 'undefined' && loadedImageURLs.has(src)) {
    isLazy = false
  }

  const { placeholder: blurDataURL, width, height, srcSet, src: outSrc } = require(`~/src/images/${src}`)
  const serSetWebp = require(`~/src/images/${src}?format=webp`).srcSet

  if (process.env.NODE_ENV !== 'production') {
    if (!src) {
      throw new Error(
        `Image is missing required "src" property. Make sure you pass "src" in props to the \`next/image\` component. Received: ${JSON.stringify(
          { width, height }
        )}`
      )
    }

    if (!VALID_LAYOUT_VALUES.includes(layout)) {
      throw new Error(
        `Image with src "${src}" has invalid "layout" property. Provided "${layout}" should be one of ${VALID_LAYOUT_VALUES.map(
          String
        ).join(',')}.`
      )
    }

    if (!VALID_LOADING_VALUES.includes(loading)) {
      throw new Error(
        `Image with src "${src}" has invalid "loading" property. Provided "${loading}" should be one of ${VALID_LOADING_VALUES.map(
          String
        ).join(',')}.`
      )
    }

    if (priority && loading === 'lazy') {
      throw new Error(
        `Image with src "${src}" has both "priority" and "loading='lazy'" properties. Only one should be used.`
      )
    }

    if ('ref' in rest) {
      console.warn(
        `Image with src "${src}" is using unsupported "ref" property. Consider using the "onLoadingComplete" property instead.`
      )
    }

    if ('style' in rest) {
      console.warn(
        `Image with src "${src}" is using unsupported "style" property. Please use the "className" property instead.`
      )
    }
  }

  const { ref, inView } = useInView({ rootMargin: lazyBoundary, triggerOnce: true, skip: !isLazy })
  const isVisible = !isLazy || inView

  const wrapperStyle: JSX.IntrinsicElements['span']['style'] = {
    boxSizing: 'border-box',
    display: 'block',
    overflow: 'hidden',
    width: 'initial',
    height: 'initial',
    background: 'none',
    opacity: 1,
    border: 0,
    margin: 0,
    padding: 0,
  }
  const sizerStyle: JSX.IntrinsicElements['span']['style'] = {
    boxSizing: 'border-box',
    display: 'block',
    width: 'initial',
    height: 'initial',
    background: 'none',
    opacity: 1,
    border: 0,
    margin: 0,
    padding: 0,
  }
  let hasSizer = false
  let sizerSvg: string | undefined
  const imgStyle: ImgElementStyle = {
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
          backgroundSize: objectFit || 'cover',
          backgroundImage: `url("${blurDataURL}")`,
          backgroundPosition: objectPosition || '0% 0%',
        }
      : {}
  if (layout === 'fill') {
    wrapperStyle.display = 'block'
    wrapperStyle.position = 'absolute'
    wrapperStyle.top = 0
    wrapperStyle.left = 0
    wrapperStyle.bottom = 0
    wrapperStyle.right = 0
  } else if (layout === 'responsive') {
    wrapperStyle.display = 'block'
    wrapperStyle.position = 'relative'
    hasSizer = true
    sizerStyle.paddingTop = `calc(${height} / ${width} * 100%)`
  } else if (layout === 'intrinsic') {
    wrapperStyle.display = 'inline-block'
    wrapperStyle.position = 'relative'
    wrapperStyle.maxWidth = '100%'
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasSizer = true
    sizerStyle.maxWidth = '100%'
    sizerSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" version="1.1"/>`
  } else if (layout === 'fixed') {
    wrapperStyle.display = 'inline-block'
    wrapperStyle.position = 'relative'
    wrapperStyle.width = width
    wrapperStyle.height = height
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
    <span className={wrapperClassName} style={wrapperStyle}>
      {sizerStyle && (
        <span style={sizerStyle}>
          {sizerSvg && (
            <img
              style={{
                maxWidth: '100%',
                display: 'block',
                margin: 0,
                border: 'none',
                padding: 0,
              }}
              alt=""
              aria-hidden={true}
              src={`data:image/svg+xml;base64,${toBase64(sizerSvg)}`}
            />
          )}
        </span>
      )}
      <picture>
        <source srcSet={imgAttributes.serSetWebp} type="image/webp" />
        <img
          {...rest}
          src={imgAttributes.src}
          srcSet={imgAttributes.srcSet}
          sizes={imgAttributes.sizes}
          decoding="async"
          className={className}
          ref={(img) => {
            ref(img)
            handleLoading(img, outSrc, layout, placeholder, onLoadingComplete)
          }}
          style={{ ...imgStyle, ...blurStyle }}
          alt={alt}
        />
      </picture>
      <noscript>
        <img
          {...rest}
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
            key={'__nimg-' + imgAttributes.src + imgAttributes.serSetWebp + imgAttributes.sizes}
            rel="preload"
            as="image"
            href={imgAttributes.serSetWebp ? undefined : imgAttributes.src}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: imagesrcset is not yet in the link element type.
            imagesrcset={imgAttributes.serSetWebp}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: imagesizes is not yet in the link element type.
            imagesizes={imgAttributes.sizes}
          ></link>
        </Head>
      ) : null}
    </span>
  )
}

export default ExportImage
