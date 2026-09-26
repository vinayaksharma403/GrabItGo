import React, { useState, useEffect, useCallback } from 'react'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/axios'

const Product = () => {
    const [productData, setProductData] = useState([])
    const [page] = useState(1)

    const fetchProductData = useCallback(async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getProduct,
                params: { page }
            })
            const { data: responseData } = response
            if (responseData.success) {
                setProductData(responseData.data || [])
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }, [page])

    useEffect(() => {
        fetchProductData()
    }, [fetchProductData])

    return (
        <div className='p-4'>
            <h2 className='font-semibold text-lg'>Product Catalog ({productData.length} items)</h2>
        </div>
    )
}

export default Product
