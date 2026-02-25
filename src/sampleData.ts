import { ChartConfig, DataPoint } from './types';

export interface SampleDataset {
  name: string;
  config: Partial<ChartConfig>;
  data: DataPoint[];
  youtubeTitle: string;
  aiScript: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    name: 'Global Smartphone Market Share (2012–2022)',
    youtubeTitle: 'The Rise and Fall of Smartphone Giants (2012-2022) | Market Share Race',
    aiScript: 'Welcome to the smartphone market share race. Watch as Samsung and Apple battle for dominance, while new players like Xiaomi and Oppo rise to challenge the status quo.',
    config: {
      title: 'Global Smartphone Market Share',
      subtitle: '2012 – 2022',
      caption: 'Data source: Market Research Reports',
      type: 'bar',
      maxBars: 6,
      duration: 800,
      interpolation: true,
      fps: 60,
    },
    data: [
      { date: '2012', name: 'Apple', value: 18 }, { date: '2012', name: 'Samsung', value: 23 }, { date: '2012', name: 'Huawei', value: 5 }, { date: '2012', name: 'Xiaomi', value: 2 }, { date: '2012', name: 'Oppo', value: 3 }, { date: '2012', name: 'Vivo', value: 2 },
      { date: '2013', name: 'Apple', value: 20 }, { date: '2013', name: 'Samsung', value: 25 }, { date: '2013', name: 'Huawei', value: 6 }, { date: '2013', name: 'Xiaomi', value: 3 }, { date: '2013', name: 'Oppo', value: 4 }, { date: '2013', name: 'Vivo', value: 3 },
      { date: '2014', name: 'Apple', value: 21 }, { date: '2014', name: 'Samsung', value: 24 }, { date: '2014', name: 'Huawei', value: 8 }, { date: '2014', name: 'Xiaomi', value: 5 }, { date: '2014', name: 'Oppo', value: 5 }, { date: '2014', name: 'Vivo', value: 4 },
      { date: '2015', name: 'Apple', value: 19 }, { date: '2015', name: 'Samsung', value: 22 }, { date: '2015', name: 'Huawei', value: 10 }, { date: '2015', name: 'Xiaomi', value: 7 }, { date: '2015', name: 'Oppo', value: 6 }, { date: '2015', name: 'Vivo', value: 5 },
      { date: '2016', name: 'Apple', value: 18 }, { date: '2016', name: 'Samsung', value: 21 }, { date: '2016', name: 'Huawei', value: 12 }, { date: '2016', name: 'Xiaomi', value: 8 }, { date: '2016', name: 'Oppo', value: 7 }, { date: '2016', name: 'Vivo', value: 6 },
      { date: '2017', name: 'Apple', value: 19 }, { date: '2017', name: 'Samsung', value: 20 }, { date: '2017', name: 'Huawei', value: 14 }, { date: '2017', name: 'Xiaomi', value: 10 }, { date: '2017', name: 'Oppo', value: 8 }, { date: '2017', name: 'Vivo', value: 7 },
      { date: '2018', name: 'Apple', value: 20 }, { date: '2018', name: 'Samsung', value: 19 }, { date: '2018', name: 'Huawei', value: 16 }, { date: '2018', name: 'Xiaomi', value: 12 }, { date: '2018', name: 'Oppo', value: 9 }, { date: '2018', name: 'Vivo', value: 8 },
      { date: '2019', name: 'Apple', value: 21 }, { date: '2019', name: 'Samsung', value: 18 }, { date: '2019', name: 'Huawei', value: 15 }, { date: '2019', name: 'Xiaomi', value: 14 }, { date: '2019', name: 'Oppo', value: 10 }, { date: '2019', name: 'Vivo', value: 9 },
      { date: '2020', name: 'Apple', value: 23 }, { date: '2020', name: 'Samsung', value: 17 }, { date: '2020', name: 'Huawei', value: 12 }, { date: '2020', name: 'Xiaomi', value: 16 }, { date: '2020', name: 'Oppo', value: 11 }, { date: '2020', name: 'Vivo', value: 10 },
      { date: '2021', name: 'Apple', value: 25 }, { date: '2021', name: 'Samsung', value: 18 }, { date: '2021', name: 'Huawei', value: 8 }, { date: '2021', name: 'Xiaomi', value: 18 }, { date: '2021', name: 'Oppo', value: 12 }, { date: '2021', name: 'Vivo', value: 11 },
      { date: '2022', name: 'Apple', value: 27 }, { date: '2022', name: 'Samsung', value: 20 }, { date: '2022', name: 'Huawei', value: 5 }, { date: '2022', name: 'Xiaomi', value: 19 }, { date: '2022', name: 'Oppo', value: 13 }, { date: '2022', name: 'Vivo', value: 12 },
    ]
  },
  {
    name: 'Energy Production Mix (USA vs China)',
    youtubeTitle: 'Energy Revolution: USA vs China Production Mix (2010-2022)',
    aiScript: 'The global energy landscape is shifting. Compare how the United States and China are transitioning from fossil fuels to renewables like solar and wind.',
    config: {
      title: 'Energy Production Mix',
      subtitle: 'USA vs China (2010-2022)',
      caption: 'Data source: Energy Information Administration',
      type: 'stacked',
      maxBars: 10,
      duration: 1000,
      interpolation: true,
      fps: 60,
      entityFilter: 'USA',
    },
    data: [
      { date: '2010', entity: 'USA', name: 'Coal', value: 40 }, { date: '2010', entity: 'USA', name: 'Oil', value: 25 }, { date: '2010', entity: 'USA', name: 'Gas', value: 20 }, { date: '2010', entity: 'USA', name: 'Solar', value: 3 }, { date: '2010', entity: 'USA', name: 'Wind', value: 4 }, { date: '2010', entity: 'USA', name: 'Hydro', value: 8 },
      { date: '2012', entity: 'USA', name: 'Coal', value: 38 }, { date: '2012', entity: 'USA', name: 'Oil', value: 24 }, { date: '2012', entity: 'USA', name: 'Gas', value: 22 }, { date: '2012', entity: 'USA', name: 'Solar', value: 5 }, { date: '2012', entity: 'USA', name: 'Wind', value: 5 }, { date: '2012', entity: 'USA', name: 'Hydro', value: 6 },
      { date: '2014', entity: 'USA', name: 'Coal', value: 35 }, { date: '2014', entity: 'USA', name: 'Oil', value: 23 }, { date: '2014', entity: 'USA', name: 'Gas', value: 24 }, { date: '2014', entity: 'USA', name: 'Solar', value: 7 }, { date: '2014', entity: 'USA', name: 'Wind', value: 6 }, { date: '2014', entity: 'USA', name: 'Hydro', value: 5 },
      { date: '2016', entity: 'USA', name: 'Coal', value: 30 }, { date: '2016', entity: 'USA', name: 'Oil', value: 22 }, { date: '2016', entity: 'USA', name: 'Gas', value: 26 }, { date: '2016', entity: 'USA', name: 'Solar', value: 10 }, { date: '2016', entity: 'USA', name: 'Wind', value: 7 }, { date: '2016', entity: 'USA', name: 'Hydro', value: 5 },
      { date: '2018', entity: 'USA', name: 'Coal', value: 25 }, { date: '2018', entity: 'USA', name: 'Oil', value: 21 }, { date: '2018', entity: 'USA', name: 'Gas', value: 28 }, { date: '2018', entity: 'USA', name: 'Solar', value: 12 }, { date: '2018', entity: 'USA', name: 'Wind', value: 9 }, { date: '2018', entity: 'USA', name: 'Hydro', value: 5 },
      { date: '2020', entity: 'USA', name: 'Coal', value: 20 }, { date: '2020', entity: 'USA', name: 'Oil', value: 20 }, { date: '2020', entity: 'USA', name: 'Gas', value: 30 }, { date: '2020', entity: 'USA', name: 'Solar', value: 15 }, { date: '2020', entity: 'USA', name: 'Wind', value: 10 }, { date: '2020', entity: 'USA', name: 'Hydro', value: 5 },
      { date: '2022', entity: 'USA', name: 'Coal', value: 15 }, { date: '2022', entity: 'USA', name: 'Oil', value: 18 }, { date: '2022', entity: 'USA', name: 'Gas', value: 32 }, { date: '2022', entity: 'USA', name: 'Solar', value: 18 }, { date: '2022', entity: 'USA', name: 'Wind', value: 12 }, { date: '2022', entity: 'USA', name: 'Hydro', value: 5 },
      { date: '2010', entity: 'China', name: 'Coal', value: 70 }, { date: '2010', entity: 'China', name: 'Oil', value: 15 }, { date: '2010', entity: 'China', name: 'Gas', value: 5 }, { date: '2010', entity: 'China', name: 'Solar', value: 1 }, { date: '2010', entity: 'China', name: 'Wind', value: 2 }, { date: '2010', entity: 'China', name: 'Hydro', value: 7 },
      { date: '2012', entity: 'China', name: 'Coal', value: 68 }, { date: '2012', entity: 'China', name: 'Oil', value: 14 }, { date: '2012', entity: 'China', name: 'Gas', value: 6 }, { date: '2012', entity: 'China', name: 'Solar', value: 2 }, { date: '2012', entity: 'China', name: 'Wind', value: 3 }, { date: '2012', entity: 'China', name: 'Hydro', value: 7 },
      { date: '2014', entity: 'China', name: 'Coal', value: 65 }, { date: '2014', entity: 'China', name: 'Oil', value: 13 }, { date: '2014', entity: 'China', name: 'Gas', value: 7 }, { date: '2014', entity: 'China', name: 'Solar', value: 3 }, { date: '2014', entity: 'China', name: 'Wind', value: 5 }, { date: '2014', entity: 'China', name: 'Hydro', value: 7 },
      { date: '2016', entity: 'China', name: 'Coal', value: 60 }, { date: '2016', entity: 'China', name: 'Oil', value: 12 }, { date: '2016', entity: 'China', name: 'Gas', value: 8 }, { date: '2016', entity: 'China', name: 'Solar', value: 5 }, { date: '2016', entity: 'China', name: 'Wind', value: 7 }, { date: '2016', entity: 'China', name: 'Hydro', value: 8 },
      { date: '2018', entity: 'China', name: 'Coal', value: 55 }, { date: '2018', entity: 'China', name: 'Oil', value: 11 }, { date: '2018', entity: 'China', name: 'Gas', value: 10 }, { date: '2018', entity: 'China', name: 'Solar', value: 8 }, { date: '2018', entity: 'China', name: 'Wind', value: 10 }, { date: '2018', entity: 'China', name: 'Hydro', value: 6 },
      { date: '2020', entity: 'China', name: 'Coal', value: 50 }, { date: '2020', entity: 'China', name: 'Oil', value: 10 }, { date: '2020', entity: 'China', name: 'Gas', value: 12 }, { date: '2020', entity: 'China', name: 'Solar', value: 10 }, { date: '2020', entity: 'China', name: 'Wind', value: 12 }, { date: '2020', entity: 'China', name: 'Hydro', value: 6 },
      { date: '2022', entity: 'China', name: 'Coal', value: 45 }, { date: '2022', entity: 'China', name: 'Oil', value: 9 }, { date: '2022', entity: 'China', name: 'Gas', value: 15 }, { date: '2022', entity: 'China', name: 'Solar', value: 13 }, { date: '2022', entity: 'China', name: 'Wind', value: 14 }, { date: '2022', entity: 'China', name: 'Hydro', value: 4 },
    ]
  },
  {
    name: 'YouTube Subscriber Growth (2023)',
    youtubeTitle: 'YouTube Growth Race: Who Gained the Most Subscribers in 2023?',
    aiScript: '2023 was a massive year for YouTube creators. Watch the monthly subscriber growth as Channel A and Channel B fight for the top spot in this high-frequency race.',
    config: {
      title: 'YouTube Subscriber Growth',
      subtitle: 'Monthly Growth in 2023 (Millions)',
      caption: 'Data source: Social Media Analytics',
      type: 'bar',
      maxBars: 4,
      duration: 500,
      interpolation: true,
      fps: 60,
    },
    data: [
      { date: 'Jan-2023', name: 'ChannelA', value: 1.2 }, { date: 'Jan-2023', name: 'ChannelB', value: 1.5 }, { date: 'Jan-2023', name: 'ChannelC', value: 0.9 }, { date: 'Jan-2023', name: 'ChannelD', value: 0.7 },
      { date: 'Feb-2023', name: 'ChannelA', value: 1.4 }, { date: 'Feb-2023', name: 'ChannelB', value: 1.6 }, { date: 'Feb-2023', name: 'ChannelC', value: 1.1 }, { date: 'Feb-2023', name: 'ChannelD', value: 0.9 },
      { date: 'Mar-2023', name: 'ChannelA', value: 1.6 }, { date: 'Mar-2023', name: 'ChannelB', value: 1.7 }, { date: 'Mar-2023', name: 'ChannelC', value: 1.4 }, { date: 'Mar-2023', name: 'ChannelD', value: 1.0 },
      { date: 'Apr-2023', name: 'ChannelA', value: 1.8 }, { date: 'Apr-2023', name: 'ChannelB', value: 1.9 }, { date: 'Apr-2023', name: 'ChannelC', value: 1.6 }, { date: 'Apr-2023', name: 'ChannelD', value: 1.2 },
      { date: 'May-2023', name: 'ChannelA', value: 2.1 }, { date: 'May-2023', name: 'ChannelB', value: 2.0 }, { date: 'May-2023', name: 'ChannelC', value: 1.9 }, { date: 'May-2023', name: 'ChannelD', value: 1.4 },
      { date: 'Jun-2023', name: 'ChannelA', value: 2.4 }, { date: 'Jun-2023', name: 'ChannelB', value: 2.3 }, { date: 'Jun-2023', name: 'ChannelC', value: 2.2 }, { date: 'Jun-2023', name: 'ChannelD', value: 1.6 },
      { date: 'Jul-2023', name: 'ChannelA', value: 2.7 }, { date: 'Jul-2023', name: 'ChannelB', value: 2.5 }, { date: 'Jul-2023', name: 'ChannelC', value: 2.4 }, { date: 'Jul-2023', name: 'ChannelD', value: 1.8 },
      { date: 'Aug-2023', name: 'ChannelA', value: 3.0 }, { date: 'Aug-2023', name: 'ChannelB', value: 2.8 }, { date: 'Aug-2023', name: 'ChannelC', value: 2.7 }, { date: 'Aug-2023', name: 'ChannelD', value: 2.0 },
      { date: 'Sep-2023', name: 'ChannelA', value: 3.3 }, { date: 'Sep-2023', name: 'ChannelB', value: 3.1 }, { date: 'Sep-2023', name: 'ChannelC', value: 2.9 }, { date: 'Sep-2023', name: 'ChannelD', value: 2.3 },
      { date: 'Oct-2023', name: 'ChannelA', value: 3.6 }, { date: 'Oct-2023', name: 'ChannelB', value: 3.5 }, { date: 'Oct-2023', name: 'ChannelC', value: 3.2 }, { date: 'Oct-2023', name: 'ChannelD', value: 2.6 },
      { date: 'Nov-2023', name: 'ChannelA', value: 4.0 }, { date: 'Nov-2023', name: 'ChannelB', value: 3.9 }, { date: 'Nov-2023', name: 'ChannelC', value: 3.6 }, { date: 'Nov-2023', name: 'ChannelD', value: 2.9 },
      { date: 'Dec-2023', name: 'ChannelA', value: 4.5 }, { date: 'Dec-2023', name: 'ChannelB', value: 4.3 }, { date: 'Dec-2023', name: 'ChannelC', value: 4.0 }, { date: 'Dec-2023', name: 'ChannelD', value: 3.2 },
    ]
  }
];
