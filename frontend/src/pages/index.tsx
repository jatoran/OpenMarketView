import dynamic from 'next/dynamic'
import type { NextPage } from 'next'

const StockTracker = dynamic(() => import('../components/StockTracker'), { ssr: false })


const Home: NextPage = () => {
  return (
    <div className="container mx-auto p-4">
      <StockTracker />
    </div>
  )
}

export default Home