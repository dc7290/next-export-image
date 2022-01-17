import type { NextPage } from 'next'

import { ExportImage } from '~/examples/src/components/ExportImage'

const IndexPage: NextPage = () => {
  return (
    <div style={{ width: '85vw', maxWidth: '960px', margin: '0 auto' }}>
      <ExportImage src="img.png" sizes="(min-width: 768px) 720px, 85vw" priority />
      <div style={{ height: '100vh' }}></div>
      <ExportImage src="img.png" placeholder="blur" />
    </div>
  )
}

export default IndexPage
