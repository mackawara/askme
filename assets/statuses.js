const statuses = [
  "See the magic of AI creative, To create a letter: Write a letter to the Regional manager requesting for more staff during the busy Christmas season, 4 genral hand , 2 till operators",
  "Struggling with assignments or exam prep? Let AskMe_AI be your virtual study buddy, providing instant answers and guidance! Check it out:  https://wa.me/263711489602",
  "Need help understanding complex concepts? Just ask AskMe_AI for simplified explanations tailored to your learning style. Get started here:  https://wa.me/263711489602",
  "Teachers, imagine having an AI-powered assistant that can generate interactive lesson plans on-demand! Discover how AskMeAI can revolutionize your teaching methods:  https://wa.me/263711489602",
  "Stuck on a math problem? Don't fret - unleash the power of AskMe_AI's advanced algorithms to solve equations step-by-step! Try it now:  https://wa.me/263711489602",
  "Looking for reliable research sources? Save time by asking AskMe_Ai for curated articles and scholarly papers in seconds flat! Access this valuable resource here: https://wa.me/263711489602",
  "Worried about plagiarism in your essays or reports? Use Askme Ai’s powerful language analysis tools to ensure originality while enhancing writing skills. https://wa.me/263711489602",
  "Students seeking career advice will find invaluable support from #Askmeai.Get personalized recommendations based on interests & qualifications! https://wa.me/263711489602",
];
const randomStatus = () => {
  const index = Math.floor(Math.random() * statuses.length);
  return statuses[index];
};
module.exports = randomStatus;
