import React, {useEffect, useMemo, useState} from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import './sliderOverrides.css'


const forecastOptions = [
	{id: 'lowmid', text: 'Low/Mid', url: 'isl_skyjahula2', sMin: 1, sMax: 66, class: "clip-image invert hue-rotate-[325deg]"},
	{id: 'aurora', text: 'Aurora', url: '', sMin: 1, sMax: 12, class: "md:max-w-[80vh]"},
	{id: 'low', text: 'Low', url: 'harmonie_island_lcc', sMin: 1, sMax: 66, class: "clip-image invert hue-rotate-[165deg]"},
	{id: 'mid', text: 'Mid', url: 'harmonie_island_mcc', sMin: 1, sMax: 66, class: "clip-image invert hue-rotate-[72deg]"},
	{id: 'high', text: 'High', url: 'harmonie_island_hcc', sMin: 1, sMax: 66, class: "clip-image invert hue-rotate-[78deg]"}
]

const addHours = (d,h=1) => d && new Date(new Date(d).setHours(d.getHours()+h))
const addMinutes = (d,m=1) => d && new Date(new Date(d).setMinutes(d.getMinutes()+m))
const sliderToMinutes = s => 5*s
const getDayName = d => {
	const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
	return d && weekday[d.getDay()]
}
const pad0 = o => o.toString().padStart(2,'0')

const loadImage = url => new Promise((resolve,reject)=>{
	const img = new Image()
	img.onload = resolve
	img.onerror = reject
	img.src = url
})

const getForecastImage = (d, slider=1, type='lowmid') => {
	if(!d){return ''}

	if(type==='aurora'){
		d = addMinutes(d,sliderToMinutes(slider-12)) //this is assuming a 60 minute Forecast Lead Time
		if(!d){return ''}
		let url = `https://services.swpc.noaa.gov/images/animations/ovation/north`
		url += `/aurora_N_${d.getFullYear()}-${pad0(d.getMonth()+1)}-${pad0(d.getDate())}_${pad0(d.getHours())}${pad0(d.getMinutes())}.jpg`
		return url
	} else {
		let url = `https://en.vedur.is/photos`
		url += `/${forecastOptions.find(fo=>fo.id===type)?.url}`
		url += `/${d.getFullYear().toString().slice(2)}${pad0(d.getMonth()+1)}${pad0(d.getDate())}_${pad0(d.getHours())}00_${slider}.png`
		return url
	}
}

const preloadImages = (ft, d) => {
	const imagePromises = []
	const fo = forecastOptions.find(fo=>fo.id===ft)
	for(let i=fo.sMin; i<fo.sMax; i++){
		imagePromises.push(loadImage(getForecastImage(d,i,fo.id)))
	}
	return Promise.all(imagePromises)
}

const determineCloudForecastStart = () => {
	let attempts = 20
	const checkDate = d => (
		loadImage(getForecastImage(d,1,'lowmid'))
		.then(()=>{
			console.log(`Start date is: ${d.toString()}`)
			return d
		})
		.catch(()=>{
			attempts = attempts - 1
			if(attempts>0){
				return Promise.resolve(checkDate(addHours(d,-1)))
			} else {
				const error = 'Couldnt find working image!'
				console.log(error)
				return Promise.reject(error)
			}
		})
	)

	let date = new Date()
	date.setMinutes(0,0,0)
	return checkDate(date)
}

const determineAuroraForecastStart = () => {
	let date = new Date()
	const mins = date.getMinutes()
	const roundToFiveMins = Math.round(mins/5-1)*5
	date.setMinutes(roundToFiveMins,0,0)
	return new Date(date)
}

const App = () => {
	const [cloudForecastStart, setCloudForecastStart] = useState()
	const [status, setStatus] = useState('loading')
	const [forecastSlider, setForecastSlider] = useState(1)
	const [forecastType, setForecastType] = useState('lowmid')
	const [preloaded, setPreloaded] = useState([])

	useEffect(()=>{forecastType==='aurora' && setForecastSlider(1)},[forecastType])

	const sliderMin = forecastOptions.find(fo=>fo.id===forecastType)?.sMin
	const sliderMax = forecastOptions.find(fo=>fo.id===forecastType)?.sMax

	const auroraStart = determineAuroraForecastStart()
	const forecastStart = forecastType==='aurora' ? auroraStart : cloudForecastStart

	useEffect(()=>{
		if((forecastType!=='aurora' && cloudForecastStart) || forecastType==='aurora'){
			if(!preloaded.includes(forecastType)){
				setStatus('loading')
				setPreloaded([...preloaded, forecastType])
				preloadImages(forecastType, forecastStart).then(()=>{setStatus('ok')})
			}
			
		}
	},[cloudForecastStart,forecastType])

	useEffect(()=>{
		if(!cloudForecastStart){
			determineCloudForecastStart()
			.then(fs=>{
				setCloudForecastStart(fs)
				setStatus('ok')
			})
			.catch(()=>setStatus('error'))
		}
	},[])

	const cycleForecastType = () => {
		const types = forecastOptions.map(fo=>fo.id)
		const fi  = types.indexOf(forecastType)
		const nfi = (fi + 1) % types.length
		setForecastType(types[nfi])
		if(window.refreshToUpdate === true){location.reload()} //reload page if there are any updates
	}

	const formatDateText = d => d && `${getDayName(d)} ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`

	const marks = useMemo(() => {
		if(!forecastStart){return {}}
		let marks = {}
		for(let i=sliderMin; i<sliderMax; i++){
			const addMark = label => {marks[i] = {label,style: {color: "white"}}}
			if(forecastType==='aurora'){
				const checkedDate = addMinutes(forecastStart,sliderToMinutes(i))
				if(checkedDate.getMinutes()%15===0){
					addMark(`${checkedDate.getHours()}:${checkedDate.getMinutes().toString().padStart(2,'0')}`)
				}
			} else {
				const checkedDate = addHours(forecastStart,i)
				if(checkedDate.getHours()===0){
					addMark(getDayName(checkedDate))
				}
			}
		}
		return marks
	},[forecastStart,sliderMin,sliderMax,forecastType])

	return (
		<div className="box-border bg-gray-800 w-full h-screen min-w-full min-h-full flex flex-col justify-between items-stretch text-white select-none gap-y-2 p-2 pb-12">
			<div className="flex items-center justify-between">
				<div className="transition duration-500 hover:bg-gray-900  cursor-pointer rounded" onClick={cycleForecastType}>
					<div className="text-xl xl:text-3xl px-6 py-2 xl:px-20 xl:py-4">
						🔁{forecastOptions.find(fo=>fo.id===forecastType)?.text}
					</div>
				</div>
				<div className="">
					<div className="text-xl xl:text-3xl px-6 py-2 xl:px-20 xl:py-4">
						{formatDateText(forecastType==='aurora' ? addMinutes(forecastStart,sliderToMinutes(forecastSlider)) : addHours(forecastStart,forecastSlider))}
					</div>
				</div>
			</div>
			<div className="flex justify-center items-center">
				{status === 'loading' && <div className="">Loading...</div>}
				{status === 'error' && <div className="">Error!</div>}
				{status === 'ok' && (
					<img
						className={`object-contain ${forecastOptions.find(fo=>fo.id===forecastType)?.class}`}
						src={getForecastImage(forecastStart,forecastSlider,forecastType)}
					/>
				)}
			</div>
			<div className="border-box px-6 xl:px-20">
				<Slider
					min={sliderMin}
					max={sliderMax}
					value={forecastSlider}
					onChange={setForecastSlider}
					marks={marks}
				/>
			</div>
		</div>
	)
}

export default App
