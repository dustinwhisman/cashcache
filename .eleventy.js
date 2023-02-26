module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/robots.txt');
  eleventyConfig.addPassthroughCopy('src/favicon.png');
  eleventyConfig.addPassthroughCopy('src/service-worker.js');
  eleventyConfig.addPassthroughCopy('src/manifest.json');
  eleventyConfig.addPassthroughCopy('src/icons/*');
  eleventyConfig.addPassthroughCopy('src/scripts/**/*');
  eleventyConfig.addPassthroughCopy('src/static/*');

  return {
    dir: {
      input: 'src',
      output: 'dist',
    },
  };
};
