import React, { Component } from "react";
import {
  Input,
  Button,
  Form,
  Label,
  Col,
  Row,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  InputGroup,
  InputGroupAddon,
  InputGroupText
} from "reactstrap";
import { searchEngine } from "../shared/searchEngine";
import SpeechRec from "./SpeechRecComponent";
import { server_link } from "../shared/server_link";

class RenderSearchResult extends Component {
  constructor(props) {
    super(props);
    this.state = {
      result: this.props.result,
      isTFModalOpen: false,
      isNLModalOpen: false,
      isPLModalOpen: false
    };
    this.searchSimilar = this.searchSimilar.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.setQuery = this.setQuery.bind(this);
    this.toggleTFModal = this.toggleTFModal.bind(this);
    this.toggleNLModal = this.toggleNLModal.bind(this);
    this.togglePLModal = this.togglePLModal.bind(this);
  }
  toggleTFModal() {
    this.setState({
      isTFModalOpen: !this.state.isTFModalOpen
    });
  }
  toggleNLModal() {
    this.setState({
      isNLModalOpen: !this.state.isNLModalOpen
    });
  }
  togglePLModal() {
    this.setState({
      isPLModalOpen: !this.state.isPLModalOpen
    });
  }
  handleSearch() {
    return this.props.handleSearch();
  }
  setQuery(query) {
    return this.props.setQuery(query);
  }
  searchSimilar() {
    let new_query = this.state.result.keywords
      .slice(0)
      .sort((a, b) => (a.tf < b.tf ? 1 : a.tf > b.tf ? -1 : 0))
      .slice(0, 5)
      .map(a => a.keyword)
      .join(" ");
    this.setQuery(new_query);
    this.handleSearch();
    console.log(this.state.result.keywords);
  }
  render() {
    const kws = this.state.result.keywords
      .map(kw_list => kw_list.keyword + " " + kw_list.tf)
      .join(", ");
    const nls = this.state.result.next_links.map(nl => <p>{nl}</p>);
    return (
      <div className="row border-top">
        <div className="col-2">
          <p>source</p>
          <button className="btn btn-primary" onClick={this.searchSimilar}>
            Get similar pages
          </button>
        </div>
        <div className="col-8 offset-1 text-left">
          <p>
            <b>Page Title</b>: {this.state.result.page_title}
          </p>
          <p>
            <b>url</b>:{" "}
            <a
              href={this.state.result.doc_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {this.state.result.doc_url}
            </a>
          </p>
          <p>
            <b>Last Modification Date</b>: {this.state.result.last_modified}
          </p>
          <p>
            <b>Size of page</b>: {this.state.result.doc_size}
          </p>
          <Button onClick={this.toggleTFModal} className="mb-2 mr-2">
            Show Keywords and Term frequencies
          </Button>
          <Modal isOpen={this.state.isTFModalOpen} toggle={this.toggleTFModal}>
            <ModalHeader toggle={this.toggleTFModal}>
              Keywords and Term frequencies
            </ModalHeader>
            <ModalBody>{kws}</ModalBody>
          </Modal>
          <Button onClick={this.togglePLModal} className="mb-2 mr-2">
            Show Parent links
          </Button>
          <Modal isOpen={this.state.isPLModalOpen} toggle={this.togglePLModal}>
            <ModalHeader toggle={this.togglePLModal}>Parent links</ModalHeader>
            <ModalBody>{nls}</ModalBody>
          </Modal>
          <Button onClick={this.toggleNLModal} className="mb-2 mr-2">
            Show Child links
          </Button>
          <Modal isOpen={this.state.isNLModalOpen} toggle={this.toggleNLModal}>
            <ModalHeader toggle={this.toggleNLModal}>Child links</ModalHeader>
            <ModalBody>{nls}</ModalBody>
          </Modal>
        </div>
      </div>
    );
  }
}

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: "",
      result: [],
      isModalOpen: false,
      history_queries: [],
      searchHistorySelected: [],
      history_queries_mask: [],
      all_keywords: [],
      // all_keywords_mask: [],
      allKeywordsSelected: [],
      speechRec: true
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleResearch = this.handleResearch.bind(this);
    this.handleSearchAllKeywordsSelected = this.handleSearchAllKeywordsSelected.bind(
      this
    );
    this.handleSearch = this.handleSearch.bind(this);
    this.setQuery = this.setQuery.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.handleSearchInSearchHistory = this.handleSearchInSearchHistory.bind(
      this
    );
    // this.handleSearchInAllKeywords = this.handleSearchInAllKeywords.bind(this);
    this.onSearchHistoryCheckboxBtnClick = this.onSearchHistoryCheckboxBtnClick.bind(
      this
    );
    this.onAllKeywordsCheckboxBtnClick = this.onAllKeywordsCheckboxBtnClick.bind(
      this
    );
    this.fetchAllKeywords = this.fetchAllKeywords.bind(this);
    this.componentWillMount = this.componentWillMount.bind(this);
  }
  toggleModal() {
    this.setState({
      isModalOpen: !this.state.isModalOpen
    });
  }
  handleSubmit(event) {
    let query = document.getElementById("query").value;
    this.setState({
      query: query
    });
    if (query !== "") {
      this.setState({
        history_queries: this.state.history_queries.concat([query]),
        history_queries_mask: this.state.history_queries_mask.concat([true])
      });
    }
    if (typeof event !== "undefined") event.preventDefault();
    this.handleSearch(event);
  }
  handleResearch(event) {
    let query = this.state.searchHistorySelected
      .map(idx => this.state.history_queries[idx])
      .join(" ");
    this.setQuery(query);
    this.toggleModal();
    if (typeof event !== "undefined") event.preventDefault();
    this.handleSearch(event);
  }
  handleSearchAllKeywordsSelected(event) {
    let query = this.state.allKeywordsSelected
      .map(idx => this.state.all_keywords[idx])
      .join(" ");
    this.setQuery(query);
    if (typeof event !== "undefined") event.preventDefault();
    this.handleSearch(event);
  }
  handleSearch(event) {
    let query = this.state.query;
    console.log("query", query);
    if (typeof query !== "undefined") {
      searchEngine(query).then(result => {
        // console.log(result);
        this.setState({ result: result });
      });
    }
    // let result = searchEngine(this.state.query.value);
    // console.log(result);
    // this.setState({ result: result });
    if (typeof event !== "undefined") event.preventDefault();
  }
  setQuery(query) {
    document.getElementById("query").value = query;
    this.setState({
      query: query
    });
    if (query !== "") {
      this.setState({
        history_queries: this.state.history_queries.concat([query]),
        history_queries_mask: this.state.history_queries_mask.concat([true])
      });
    }
  }
  handleSearchInSearchHistory() {
    let searchBarValue = document.getElementById("searchBarInSearchHistory")
      .value;
    if (searchBarValue === "") {
      let newMask = this.state.history_queries.map(() => true);
      this.setState({ history_queries_mask: newMask });
    } else {
      let newMask = this.state.history_queries.map(query =>
        query.includes(searchBarValue)
      );
      this.setState({ history_queries_mask: newMask });
    }
  }
  // handleSearchInAllKeywords() {
  //   let searchBarValue = document.getElementById("searchBarInAllKeywords").value;
  //   if (searchBarValue === "") {
  //     let newMask = this.state.all_keywords.map(() => true);
  //     this.setState({ all_keywords_mask: newMask });
  //   } else {
  //     let newMask = this.state.all_keywords.map((query) => query.includes(searchBarValue));
  //     this.setState({ all_keywords_mask: newMask });
  //   }
  // }
  onSearchHistoryCheckboxBtnClick(selected) {
    const index = this.state.searchHistorySelected.indexOf(selected);
    if (index < 0) {
      this.state.searchHistorySelected.push(selected);
    } else {
      this.state.searchHistorySelected.splice(index, 1);
    }
    this.setState({
      searchHistorySelected: [...this.state.searchHistorySelected]
    });
  }
  onAllKeywordsCheckboxBtnClick(selected) {
    const index = this.state.allKeywordsSelected.indexOf(selected);
    if (index < 0) {
      this.state.allKeywordsSelected.push(selected);
    } else {
      this.state.allKeywordsSelected.splice(index, 1);
    }
    this.setState({ allKeywordsSelected: [...this.state.allKeywordsSelected] });
  }
  fetchAllKeywords() {
    fetch(server_link + "/all_keywords", {
      method: "GET"
    })
      .then(response => response.json())
      .then(response => {
        this.setState({ all_keywords: response.all_keywords });
      });
    // .then(() => {let newMask = this.state.all_keywords.map(() => true);
    //   this.setState({ all_keywords_mask: newMask });});
  }
  componentWillMount() {
    this.fetchAllKeywords();
    window.SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    if (typeof window.SpeechRecognition === "undefined") {
      this.setState({ speechRec: false });
    }
  }
  render() {
    // const searchResult = this.state.result.map((r) => <RenderSearchResult key={r.id} result={r} />)
    const history_queries_render = this.state.history_queries.map(
      (query, index) =>
        this.state.history_queries_mask[index] ? (
          <React.Fragment>
            <Row>
              <Col>
                <Button
                  outline
                  color="secondary"
                  onClick={() => this.onSearchHistoryCheckboxBtnClick(index)}
                  active={this.state.searchHistorySelected.includes(index)}
                  style={{ width: "100%", marginTop: "5px" }}
                >
                  {query}
                </Button>
              </Col>
            </Row>
          </React.Fragment>
        ) : (
          <React.Fragment />
        )
    );
    // this.fetchAllKeywords();
    const all_keywords_render = this.state.all_keywords.map(
      (kw, index) => (
        // this.state.all_keywords_mask[index] ?
        <React.Fragment>
          <Row>
            <Col>
              <Button
                outline
                color="secondary"
                onClick={() => this.onAllKeywordsCheckboxBtnClick(index)}
                active={this.state.allKeywordsSelected.includes(index)}
                style={{ width: "100%", marginTop: "5px" }}
              >
                {kw}
              </Button>
            </Col>
          </Row>
        </React.Fragment>
      )
      // : <React.Fragment></React.Fragment>
    );

    return (
      <div className="container-fluid ml-0 mr-0" style={{ height: "100vh" }}>
        <div className="row" style={{ height: "100%" }}>
          <div
            className="col-10"
            style={{ overflowY: "scroll", height: "100%" }}
          >
            <div className="row pb-2">
              <div className="col-9">
                <Form onSubmit={this.handleSubmit}>
                  <Row>
                    <Col className="col-3">
                      <Label htmlFor="query">Please type your query: </Label>
                    </Col>
                    <Col className="col-7">
                      {this.state.speechRec ? (
                        <InputGroup>
                          <Input type="text" id="query" name="query" />
                          <InputGroupAddon addonType="append">
                            <SpeechRec setQuery={this.setQuery} />
                          </InputGroupAddon>
                        </InputGroup>
                      ) : (
                        <Input type="text" id="query" name="query" />
                      )}
                    </Col>
                    <Col className="col-2">
                      <Button type="submit" value="submit" color="primary">
                        Search
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </div>
              <div className="col-3">
                <Button onClick={this.toggleModal}>View query history</Button>
                <Modal
                  isOpen={this.state.isModalOpen}
                  toggle={this.toggleModal}
                >
                  <ModalHeader toggle={this.toggleModal}>
                    Your query history
                  </ModalHeader>
                  <ModalBody>
                    <Row>
                      <Col>
                        <Input
                          onChange={this.handleSearchInSearchHistory}
                          id="searchBarInSearchHistory"
                          placeholder="Search your search history"
                        />
                      </Col>
                    </Row>
                    {/* <ButtonGroup> */}
                    {history_queries_render}
                    {/* </ButtonGroup> */}
                  </ModalBody>
                  <ModalFooter>
                    <Button className="ml-5" onClick={this.handleResearch}>
                      {this.state.searchHistorySelected.length <= 1
                        ? "Search selected"
                        : "Combine and search selected"}
                    </Button>
                  </ModalFooter>
                </Modal>
              </div>
            </div>
            {this.state.result.map(r => (
              <RenderSearchResult
                key={r._id}
                result={r}
                handleSearch={this.handleSearch}
                setQuery={this.setQuery}
              />
            ))}
          </div>
          <div className="col-2 border-left" style={{ height: "100%" }}>
            <p>Search and select from all stemmed keywords in our database</p>
            <Button
              onClick={this.handleSearchAllKeywordsSelected}
              style={{ width: "100%", marginBottom: "15px" }}
            >
              {this.state.allKeywordsSelected.length <= 1
                ? "Search selected"
                : "Combine and search selected"}
            </Button>
            {/* <Input onChange={this.handleSearchInAllKeywords}
              id="searchBarInAllKeywords"
              placeholder="Search in all keywords"
              className="mb-3" /> */}
            <div style={{ overflowY: "scroll", height: "100%" }}>
              {all_keywords_render}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Search;
