import type { NextPage } from 'next'

import { ExportImage } from '~/src/components/ExportImage'

const IndexPage: NextPage = () => {
  return (
    <div style={{ width: '85vw', maxWidth: '960px', margin: '0 auto' }}>
      <ExportImage src="img.png" priority />
      <div style={{ height: '100vw' }}></div>
      <ExportImage src="img.png" placeholder="blur" />
    </div>
  )
}

export default IndexPage
