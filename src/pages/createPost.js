import React, { useEffect, useRef, useState } from "react";
import classes from "../styles/CreateBlog.module.css";

import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useParams } from "react-router-dom";

import { GET_BLOG, POST_BLOG_REQUEST } from "../redux/";

import uploadImage from "../logic/uploadImage";
import formValidation from "../logic/blogFormValidation";
import publishBlog from "../logic/publishBlog";
import CreateBlogForm from "../components/ui/CreateBlog/CreateBlogForm";
import Preview from "../components/ui/CreateBlog/Preview";
import ErrorHandler from "../logic/errorHandler";
import AlertMessage from "../components/alertMessage/alertMessage";
import { useContext } from "react";
import { ThemeContext } from "../context/context";
import Spinner from "../components/ui/spinner/spinner";
/**This component uses two case
 *  1.) When user wants to edit a blog
 * PROCEDURE
 * There's a blog id passed throug the route, get the id, and use it to fetch the particular blog from the backend
 * Then update the already loaded input fields with the data using another useEffect that only runs when there's a data from backend
 * 2.) When user wants to create a blog
 * PROCEDURE
 * Fill the forms and submit
 *
 */

const CreateBlog = (props) => {
  // local storage variable
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  //  Refs and params
  const postId = useParams();
  const dispatch = useDispatch();
  const previewRef = useRef(null);
  const formRef = useRef(null);
  const { darkTheme } = useContext(ThemeContext);

  // useState
  const [html, setHtml] = useState(null);
  const [imageFile, setFile] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [published, setPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagsInput, setTagsInput] = useState("");
  const [image, setImage] = useState(null);
  const { blogs, post_blog } = useSelector((state) => state);
  const [postingError, setPostingError] = useState(null);
  const { mssg, loading, error, success } = post_blog;

  // If there is an id that means user wants to edit so fetch their blog
  useEffect(() => {
    if (postId.id) {
      console.log("yes");
      dispatch(GET_BLOG(postId.id));
    }
  }, []);

  // If you get a blog from the backend, update the fields
  useEffect(() => {
    if (blogs.blog) {
      console.log(blogs);
      const { blog } = blogs;
      setHtml(blog.post.body);
      setTags(blog.post.tags);
      setTitle(blog.post.title);
      setDescription(blog.post.description);
      setImage(blog.post.image[0]);
    }
  }, [blogs]);

  // if user is not authorized
  useEffect(() => {
    console.log(error);
    if (error === "Unauthorized" || postingError === "Unauthorized") {
      console.log(error);
      setTimeout(() => {
        window.location.href = `/sign-in`;
      }, 3000);
    }
  }, [error, postingError]);

  //Once the blog is posted successfully
  useEffect(() => {
    console.log(published);
    if (success) {
      setTimeout(() => {
        window.location.href = `/blogs/${mssg.data.blog._id}`;
      }, 2250);
    }
    if (published) {
      setTimeout(() => {
        window.history.back();
      }, 2250);
    }
  }, [success, published]);
  // once you click on the upload image, open files and upload get the selected image or u drag image to the box
  const handleDrop = (event) => {
    event.preventDefault();
    uploadImage(event, setImage, setFile);
  };

  // Create a tag when user presses the enter key word
  const createTagHandler = (e) => {
    if (e.key === "Enter" && !tags.includes(tagsInput)) {
      e.preventDefault();
      setTags((prev) => [tagsInput, ...prev]);
      return setTagsInput("");
    }
  };

  // Remove a tag by clicking on the tag
  const removeTagHandler = (tagId) => {
    console.log(tagId, tags);
    const removedTag = tags.filter((tag) => tag !== tagId);
    setTags(removedTag);
  };

  // Validat form inputs
  const blogFormValidation = (state = "draft") => {
    return formValidation(html, image, title, tags, description, state);
  };

  // Post a blog function
  const submitBlogHandler = (e) => {
    e.preventDefault();
    const data = blogFormValidation(); // Get datas from validated inputs
    if (data !== false) {
      console.log(data);
      if (data) dispatch(POST_BLOG_REQUEST(data, token)); // Send it to the backend
    }
  };
  // Edit a blog
  const editBlogHandler = async (e) => {
    e.preventDefault();
    if (blogFormValidation("published") !== false) {
      const updatedData = blogFormValidation("published"); // Get datas from validated inputs

      const route = "blogs/";
      setIsPublishing(true);
      const data = await publishBlog(postId.id, token, route, updatedData); // Update it at the backend
      console.log(data);

      setIsPublishing(false);
      if (data.response.status === 200) {
        setPublished(true);

        setMessage("Blog Edited 😍😁");
      } else setPostingError(data.response ? data.response.data : data.message);
    }
  };
  let content = (
    <ErrorHandler
      errorMessage={error || postingError}
      duration={
        error === "Unauthorized" || postingError === "Unauthorized"
          ? 2800
          : 5000
      }
    >
      <div>
        <Preview previewRef={previewRef} formRef={formRef} />
        <div className={classes.CreateBlogContainer}>
          <CreateBlogForm
            darkTheme={darkTheme}
            formRef={formRef}
            submitBlogHandler={submitBlogHandler}
            editBlogHandler={editBlogHandler}
            title={title}
            setHtml={setHtml}
            setTagsInput={setTagsInput}
            tagsInput={tagsInput}
            createTagHandler={createTagHandler}
            postId={postId.id}
            setTitle={setTitle}
            html={html}
            description={description}
            tags={tags}
            previewRef={previewRef}
            handleDrop={handleDrop}
            image={image}
            loading={loading}
            isPublishing={isPublishing}
            removeTagHandler={removeTagHandler}
            setDescription={setDescription}
          />
          <div
            className={classes.Preview}
            ref={previewRef}
            id="previewCode"
          ></div>
        </div>
      </div>
      {success || published ? (
        <AlertMessage
          bgColor="success"
          message={message ? message : "Blog posted 😍😁"}
          duration={2000}
        />
      ) : null}
    </ErrorHandler>
  );
  if (postId) {
    if (blogs)
      content = (
        <ErrorHandler
          errorMessage={error || postingError}
          duration={
            error === "Unauthorized" || postingError === "Unauthorized"
              ? 2800
              : 5000
          }
        >
          <div>
            <Preview previewRef={previewRef} formRef={formRef} />
            <div className={classes.CreateBlogContainer}>
              <CreateBlogForm
                darkTheme={darkTheme}
                formRef={formRef}
                submitBlogHandler={submitBlogHandler}
                editBlogHandler={editBlogHandler}
                title={title}
                setHtml={setHtml}
                setTagsInput={setTagsInput}
                tagsInput={tagsInput}
                createTagHandler={createTagHandler}
                postId={postId.id}
                setTitle={setTitle}
                html={html}
                description={description}
                tags={tags}
                previewRef={previewRef}
                handleDrop={handleDrop}
                image={image}
                loading={loading}
                isPublishing={isPublishing}
                removeTagHandler={removeTagHandler}
                setDescription={setDescription}
              />
              <div
                className={classes.Preview}
                ref={previewRef}
                id="previewCode"
              ></div>
            </div>
          </div>
          {success || published ? (
            <AlertMessage
              bgColor="success"
              message={message ? message : "Blog posted 😍😁"}
              duration={2000}
            />
          ) : null}
        </ErrorHandler>
      );
    if (loading) {
      content = (
        <div style={{ display: "grid", placeItems: "center" }}>
          <Spinner />{" "}
        </div>
      );
    }
  }

  return token ? content : <Navigate to="/sign-in" replace={true} />;
};

export default CreateBlog;
