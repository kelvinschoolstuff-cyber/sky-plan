import "./weatherForecast.css";

const weatherDescriptions = {
	0: "Clear sky",
	1: "Mainly clear",
	2: "Partly cloudy",
	3: "Overcast",
	45: "Fog",
	48: "Depositing rime fog",
	51: "Light drizzle",
	53: "Moderate drizzle",
	55: "Dense drizzle",
	61: "Slight rain",
	63: "Moderate rain",
	65: "Heavy rain",
	71: "Slight snow",
	73: "Moderate snow",
	75: "Heavy snow",
	80: "Rain showers",
	81: "Moderate rain showers",
	82: "Violent rain showers",
	95: "Thunderstorm",
	96: "Thunderstorm with hail",
	99: "Thunderstorm with heavy hail",
};

function formatHour(value) {
	return new Date(`${value}:00Z`).toLocaleString(undefined, {
		weekday: "short",
		hour: "numeric",
		timeZone: "UTC",
	});
}

function HourlyForecast({ hourly }) {
	const hours = hourly?.time?.slice(0, 24) ?? [];

	return (
		<section className="forecast-section" aria-labelledby="hourly-forecast-title">
			<h2 id="hourly-forecast-title">Hourly forecast</h2>
			{hours.length ? (
				<div className="forecast-table-wrap">
					<table className="forecast-table">
						<thead>
							<tr>
								<th scope="col">Time</th>
								<th scope="col">Conditions</th>
								<th scope="col">Temperature</th>
								<th scope="col">Rain chance</th>
								<th scope="col">Rainfall</th>
							</tr>
						</thead>
						<tbody>
							{hours.map((time, index) => (
								<tr key={time}>
									<th scope="row">{formatHour(time)}</th>
									<td>{weatherDescriptions[hourly.weather_code?.[index]] ?? "Conditions unavailable"}</td>
									<td>{hourly.temperature_2m?.[index] ?? "-"}°C</td>
									<td>{hourly.precipitation_probability?.[index] ?? "-"}%</td>
									<td>{hourly.precipitation?.[index] ?? "-"} mm</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<p className="forecast-empty">Hourly forecast is not available.</p>
			)}
		</section>
	);
}

export default HourlyForecast;
